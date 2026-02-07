import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to get date/time context for AI
function getDateTimeContext(): string {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  
  const today = now.toLocaleDateString('en-US', options);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toLocaleDateString('en-US', options);
  
  const currentTime = now.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });

  return `Current date and time context:
- Today is: ${today}
- Tomorrow is: ${tomorrowStr}
- Current time: ${currentTime}`;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse SignalWire webhook data (form-urlencoded)
    const formData = await req.formData();
    const smsData: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      smsData[key] = value as string;
    }

    const fromNumber = smsData.From;
    const toNumber = smsData.To;
    const messageBody = smsData.Body?.trim() || '';
    const messageSid = smsData.MessageSid;

    console.log(`Incoming SMS from ${fromNumber} to ${toNumber}: "${messageBody}"`);

    // Find company by SignalWire phone number
    const { data: integration } = await supabase
      .from('tenant_integrations')
      .select('company_id, signalwire_project_id, signalwire_api_token, signalwire_phone_number, signalwire_space_url')
      .eq('signalwire_phone_number', toNumber)
      .single();

    if (!integration) {
      console.error('No company found for phone number:', toNumber);
      // Return cXML with no response
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
        { headers: { ...corsHeaders, 'Content-Type': 'application/xml' } }
      );
    }

    // Get company info
    const { data: company } = await supabase
      .from('companies')
      .select('name, ai_agent_prompt')
      .eq('id', integration.company_id)
      .single();

    // Log the incoming SMS
    await supabase.from('sms_logs').insert({
      company_id: integration.company_id,
      direction: 'inbound',
      from_number: fromNumber,
      to_number: toNumber,
      message: messageBody,
      status: 'received',
      twilio_sid: messageSid,
    });

    // === KEYWORD AUTO-RESPONDER ===
    // Check for hashtag keywords before AI processing
    const hashtagMatch = messageBody.match(/#(\w+)/);
    if (hashtagMatch) {
      const keyword = hashtagMatch[1].toLowerCase();
      console.log(`Detected keyword: #${keyword}`);
      
      const { data: keywordConfig } = await supabase
        .from('sms_keywords')
        .select('id, response_message')
        .eq('company_id', integration.company_id)
        .eq('keyword', keyword)
        .eq('is_enabled', true)
        .single();
      
      if (keywordConfig) {
        console.log(`Keyword match found, sending auto-response`);
        
        // Send instant response
        await sendSmsReply(integration, fromNumber, keywordConfig.response_message);
        
        // Log outbound SMS
        await supabase.from('sms_logs').insert({
          company_id: integration.company_id,
          direction: 'outbound',
          from_number: toNumber,
          to_number: fromNumber,
          message: keywordConfig.response_message,
          status: 'sent',
        });
        
        // Increment hit count
        await supabase.rpc('increment_keyword_hit', { keyword_id: keywordConfig.id });
        
        // Return empty cXML - response already sent via API
        return new Response(
          `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
          { headers: { ...corsHeaders, 'Content-Type': 'application/xml' } }
        );
      }
    }
    // === END KEYWORD AUTO-RESPONDER ===

    // Send staff notification for new SMS
    fetch(`${SUPABASE_URL}/functions/v1/send-staff-notification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyId: integration.company_id,
        notificationType: 'new_sms',
        title: 'New SMS Received',
        message: `From ${fromNumber}: "${messageBody.substring(0, 100)}${messageBody.length > 100 ? '...' : ''}"`,
        metadata: { 
          fromNumber,
          toNumber,
          messageBody: messageBody.substring(0, 500),
          messageSid
        },
        recipientRole: 'all'
      })
    }).catch(err => console.error('Failed to send staff notification:', err));

    // Build system prompt for AI
    const systemPrompt = `You are an AI assistant for ${company?.name || 'a service company'}. 
You are responding to customer SMS messages. Keep your responses concise and helpful (under 320 characters when possible).

${company?.ai_agent_prompt || ''}

${getDateTimeContext()}

Important guidelines:
- Be friendly and professional
- Keep responses brief for SMS format
- If they need to book an appointment, provide a link or ask them to call
- If they have an emergency, advise them to call the company directly
- Provide helpful information about services when asked`;

    // Check if we have Lovable AI configured
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      // Send a default response
      const defaultResponse = `Thank you for contacting ${company?.name || 'us'}! For immediate assistance, please call us. We'll respond to your message as soon as possible.`;
      await sendSmsReply(integration, fromNumber, defaultResponse);
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
        { headers: { ...corsHeaders, 'Content-Type': 'application/xml' } }
      );
    }

    // Get recent conversation history for context
    const { data: recentMessages } = await supabase
      .from('sms_logs')
      .select('direction, message, created_at')
      .eq('company_id', integration.company_id)
      .or(`from_number.eq.${fromNumber},to_number.eq.${fromNumber}`)
      .order('created_at', { ascending: false })
      .limit(10);

    // Build conversation history for AI
    const conversationHistory = (recentMessages || [])
      .reverse()
      .slice(0, -1) // Exclude current message
      .map(msg => ({
        role: msg.direction === 'inbound' ? 'user' : 'assistant',
        content: msg.message
      }));

    // Call Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory,
          { role: 'user', content: messageBody }
        ],
        stream: false,
      }),
    });

    if (!aiResponse.ok) {
      console.error('AI response error:', aiResponse.status, await aiResponse.text());
      const fallbackResponse = `Thank you for your message. A team member will respond shortly. For urgent matters, please call us directly.`;
      await sendSmsReply(integration, fromNumber, fallbackResponse);
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
        { headers: { ...corsHeaders, 'Content-Type': 'application/xml' } }
      );
    }

    const aiData = await aiResponse.json();
    const aiMessage = aiData.choices?.[0]?.message?.content || 
      `Thank you for contacting ${company?.name || 'us'}! We'll get back to you shortly.`;

    // Truncate if too long for SMS
    const truncatedMessage = aiMessage.length > 1500 
      ? aiMessage.substring(0, 1497) + '...' 
      : aiMessage;

    // Send reply via SignalWire
    await sendSmsReply(integration, fromNumber, truncatedMessage);

    // Log outbound SMS
    await supabase.from('sms_logs').insert({
      company_id: integration.company_id,
      direction: 'outbound',
      from_number: toNumber,
      to_number: fromNumber,
      message: truncatedMessage,
      status: 'sent',
    });

    // Track subscription usage for SMS
    const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM format
    const { data: existingUsage } = await supabase
      .from('subscription_usage_tracking')
      .select('sms_sent')
      .eq('company_id', integration.company_id)
      .eq('month_year', currentMonth)
      .single();

    if (existingUsage) {
      await supabase
        .from('subscription_usage_tracking')
        .update({ sms_sent: (existingUsage.sms_sent || 0) + 1 })
        .eq('company_id', integration.company_id)
        .eq('month_year', currentMonth);
    } else {
      await supabase
        .from('subscription_usage_tracking')
        .insert({
          company_id: integration.company_id,
          month_year: currentMonth,
          ai_requests: 0,
          voice_minutes: 0,
          sms_sent: 1,
          emails_sent: 0,
        });
    }

    console.log(`Sent AI response to ${fromNumber}`);

    // Return empty cXML (we're sending via API, not cXML response)
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
      { headers: { ...corsHeaders, 'Content-Type': 'application/xml' } }
    );

  } catch (error) {
    console.error('SMS handler error:', error);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
      { headers: { ...corsHeaders, 'Content-Type': 'application/xml' } }
    );
  }
});

async function sendSmsReply(
  integration: { signalwire_project_id: string; signalwire_api_token: string; signalwire_phone_number: string; signalwire_space_url: string },
  toNumber: string,
  message: string
) {
  const projectId = integration.signalwire_project_id;
  const apiToken = integration.signalwire_api_token;
  const fromNumber = integration.signalwire_phone_number;
  const spaceUrl = integration.signalwire_space_url;

  if (!projectId || !apiToken || !fromNumber || !spaceUrl) {
    console.error('Missing SignalWire credentials for SMS reply');
    return;
  }

  const signalwireUrl = `https://${spaceUrl}/api/laml/2010-04-01/Accounts/${projectId}/Messages`;
  const authHeader = btoa(`${projectId}:${apiToken}`);

  const response = await fetch(signalwireUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authHeader}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      To: toNumber,
      From: fromNumber,
      Body: message,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('SignalWire SMS send error:', error);
  }
}
