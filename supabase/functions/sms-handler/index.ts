import { createClient } from "npm:@supabase/supabase-js@2";
import { loadIndustryPackForCompany, applyIndustryPackToPrompt } from "../_shared/industry-pack.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function normalizePhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('1') && digits.length === 11) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  if (phone.startsWith('+')) return phone;
  return `+${digits}`;
}

function cxmlResponse(message: string): Response {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Response><Message>${message}</Message></Response>`;
  return new Response(xml, {
    headers: { ...corsHeaders, 'Content-Type': 'application/xml' },
  });
}

function cxmlEmpty(): Response {
  const xml = `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`;
  return new Response(xml, {
    headers: { ...corsHeaders, 'Content-Type': 'application/xml' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Parse SignalWire webhook (form-urlencoded)
    const formData = await req.formData();
    const from = formData.get('From') as string || '';
    const to = formData.get('To') as string || '';
    const body = (formData.get('Body') as string || '').trim();

    const normalizedFrom = normalizePhoneNumber(from);
    const normalizedTo = normalizePhoneNumber(to);

    console.log(`SMS received: from=${normalizedFrom} to=${normalizedTo} body="${body}"`);

    if (!body) {
      return cxmlEmpty();
    }

    // Look up company by SignalWire phone number
    const { data: integration, error: intError } = await supabase
      .from('tenant_integrations')
      .select('company_id, signalwire_project_id, signalwire_api_token, signalwire_phone_number, signalwire_space_url, google_gemini_api_key')
      .eq('signalwire_phone_number', normalizedTo)
      .maybeSingle();

    if (intError || !integration) {
      console.error('No company found for number:', normalizedTo, intError);
      return cxmlEmpty();
    }

    const { company_id, signalwire_project_id, signalwire_api_token, signalwire_space_url } = integration;

    // Check for keyword auto-responder (hashtag-based)
    if (body.startsWith('#')) {
      const keyword = body.toLowerCase().replace('#', '').trim();
      const { data: keywordMatch } = await supabase
        .from('sms_keywords')
        .select('response_message')
        .eq('company_id', company_id)
        .eq('keyword', keyword)
        .eq('is_active', true)
        .maybeSingle();

      if (keywordMatch?.response_message) {
        console.log(`Keyword match for #${keyword}`);
        await sendSmsReply(signalwire_space_url, signalwire_project_id, signalwire_api_token, normalizedTo, normalizedFrom, keywordMatch.response_message);
        await logSms(supabase, company_id, normalizedFrom, normalizedTo, body, keywordMatch.response_message, 'keyword');
        return cxmlEmpty();
      }
    }

    // Handle opt-out keywords
    const optOutKeywords = ['stop', 'unsubscribe', 'cancel', 'quit', 'end'];
    if (optOutKeywords.includes(body.toLowerCase())) {
      // Update customer opt-out
      await supabase
        .from('customer_profiles')
        .update({ sms_opt_out: true })
        .eq('company_id', company_id)
        .eq('phone', normalizedFrom);

      const optOutReply = 'You have been unsubscribed from SMS messages. Reply START to resubscribe.';
      await sendSmsReply(signalwire_space_url, signalwire_project_id, signalwire_api_token, normalizedTo, normalizedFrom, optOutReply);
      await logSms(supabase, company_id, normalizedFrom, normalizedTo, body, optOutReply, 'opt-out');
      return cxmlEmpty();
    }

    if (body.toLowerCase() === 'start') {
      await supabase
        .from('customer_profiles')
        .update({ sms_opt_out: false })
        .eq('company_id', company_id)
        .eq('phone', normalizedFrom);

      const optInReply = 'You have been resubscribed to SMS messages.';
      await sendSmsReply(signalwire_space_url, signalwire_project_id, signalwire_api_token, normalizedTo, normalizedFrom, optInReply);
      await logSms(supabase, company_id, normalizedFrom, normalizedTo, body, optInReply, 'opt-in');
      return cxmlEmpty();
    }

    // Get company info for AI context
    const { data: company } = await supabase
      .from('companies')
      .select('name, ai_agent_prompt, brand_tone')
      .eq('id', company_id)
      .single();

    // Load industry pack so terminology + SMS-agent delta are baked in.
    const pack = await loadIndustryPackForCompany(supabase, company_id);

    // Generate AI reply using Lovable AI
    const aiReply = await generateAIReply(
      supabaseUrl, supabaseKey, body,
      company?.name || 'our company',
      company?.ai_agent_prompt || '',
      company?.brand_tone || 'professional',
      pack,
    );

    // Send reply via SignalWire
    await sendSmsReply(signalwire_space_url, signalwire_project_id, signalwire_api_token, normalizedTo, normalizedFrom, aiReply);

    // Log both messages
    await logSms(supabase, company_id, normalizedFrom, normalizedTo, body, aiReply, 'ai');

    return cxmlEmpty();
  } catch (error) {
    console.error('SMS handler error:', error);
    return cxmlResponse('Sorry, we encountered an issue processing your message. Please try again later.');
  }
});

async function sendSmsReply(
  spaceUrl: string, projectId: string, apiToken: string,
  from: string, to: string, body: string
): Promise<void> {
  const url = `https://${spaceUrl}/api/laml/2010-04-01/Accounts/${projectId}/Messages.json`;
  const auth = btoa(`${projectId}:${apiToken}`);

  const formData = new URLSearchParams();
  formData.append('From', from);
  formData.append('To', to);
  formData.append('Body', body);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: formData.toString(),
  });

  const responseText = await response.text();
  console.log(`SignalWire SMS reply status: ${response.status}`);

  if (!response.ok) {
    console.error('SignalWire SMS error:', responseText);
    throw new Error(`Failed to send SMS: ${response.status}`);
  }
}

async function logSms(
  supabase: any, companyId: string,
  from: string, to: string,
  inboundBody: string, outboundBody: string, source: string
): Promise<void> {
  // Log inbound
  await supabase.from('sms_logs').insert({
    company_id: companyId,
    from_number: from,
    to_number: to,
    message: inboundBody,
    direction: 'inbound',
    status: 'received',
    metadata: { source },
  });

  // Log outbound reply
  await supabase.from('sms_logs').insert({
    company_id: companyId,
    from_number: to,
    to_number: from,
    message: outboundBody,
    direction: 'outbound',
    status: 'sent',
    metadata: { source },
  });
}

async function generateAIReply(
  supabaseUrl: string, supabaseKey: string,
  customerMessage: string, companyName: string,
  agentPrompt: string, brandTone: string,
  pack: Awaited<ReturnType<typeof loadIndustryPackForCompany>> = null,
): Promise<string> {
  try {
    const baseSystemPrompt = agentPrompt || `You are a helpful SMS assistant for ${companyName}. Keep responses concise (under 160 characters when possible). Be ${brandTone}. Do not use markdown formatting.`;
    const systemPrompt = applyIndustryPackToPrompt(baseSystemPrompt, pack, 'sms');

    const response = await fetch(`${supabaseUrl}/functions/v1/ai-agent-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        message: customerMessage,
        systemPrompt,
        model: 'google/gemini-2.5-flash',
      }),
    });

    const text = await response.text();
    try {
      const data = JSON.parse(text);
      return data.reply || data.response || data.message || 'Thanks for your message! We\'ll get back to you shortly.';
    } catch {
      return text.substring(0, 320) || 'Thanks for your message! We\'ll get back to you shortly.';
    }
  } catch (error) {
    console.error('AI reply generation failed:', error);
    return 'Thanks for your message! We\'ll get back to you shortly.';
  }
}
