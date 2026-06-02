import { createClient } from "npm:@supabase/supabase-js@2";
import { loadIndustryPackForCompany, applyTerminology } from "../_shared/industry-pack.ts";

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const bodyText = await req.text();
    let payload: any;
    try {
      payload = JSON.parse(bodyText);
    } catch {
      throw new Error('Invalid JSON body');
    }

    const { companyId, customerPhone, customerName, message: rawMessage, appointmentId } = payload;

    if (!companyId) throw new Error('companyId is required');
    if (!customerPhone) throw new Error('customerPhone is required');
    if (!rawMessage) throw new Error('message is required');

    // Apply industry-aware terminology (no-op if message has no placeholders)
    const pack = await loadIndustryPackForCompany(supabase, companyId);
    const message = applyTerminology(rawMessage, pack);

    const normalizedPhone = normalizePhoneNumber(customerPhone);

    // Check SMS opt-out
    const { data: profile } = await supabase
      .from('customer_profiles')
      .select('sms_opt_out')
      .eq('company_id', companyId)
      .eq('phone', normalizedPhone)
      .maybeSingle();

    if (profile?.sms_opt_out) {
      console.log(`Customer ${normalizedPhone} has opted out of SMS`);
      return new Response(
        JSON.stringify({ success: false, reason: 'Customer opted out of SMS' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch SignalWire credentials
    const { data: integration, error: intError } = await supabase
      .from('tenant_integrations')
      .select('signalwire_project_id, signalwire_api_token, signalwire_phone_number, signalwire_space_url')
      .eq('company_id', companyId)
      .maybeSingle();

    if (intError || !integration) {
      throw new Error('SignalWire integration not configured');
    }

    const { signalwire_project_id, signalwire_api_token, signalwire_phone_number, signalwire_space_url } = integration;

    if (!signalwire_project_id || !signalwire_api_token || !signalwire_phone_number || !signalwire_space_url) {
      throw new Error('SignalWire credentials are incomplete');
    }

    // Send SMS via SignalWire
    const swUrl = `https://${signalwire_space_url}/api/laml/2010-04-01/Accounts/${signalwire_project_id}/Messages.json`;
    const auth = btoa(`${signalwire_project_id}:${signalwire_api_token}`);

    const formData = new URLSearchParams();
    formData.append('From', signalwire_phone_number);
    formData.append('To', normalizedPhone);
    formData.append('Body', message);

    const response = await fetch(swUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: formData.toString(),
    });

    const responseText = await response.text();
    console.log(`SMS send status: ${response.status}`);

    if (!response.ok) {
      console.error('SignalWire SMS error:', responseText);
      let swCode = '';
      let swMessage = '';
      try {
        const parsed = JSON.parse(responseText);
        swCode = String(parsed.code ?? '');
        swMessage = String(parsed.message ?? '');
      } catch { /* non-JSON */ }
      const detail = swCode || swMessage
        ? `SignalWire ${swCode}: ${swMessage}`
        : `SignalWire HTTP ${response.status}`;
      let hint = '';
      if (swCode === '10000' || /verified caller id/i.test(swMessage)) {
        hint = ' — The SignalWire Space connected to Aura is still enforcing trial-style verified-recipient limits. Confirm the upgraded Space matches the credentials saved in Aura and that the From number belongs to that Space, then verify the recipient number in that Space or contact SignalWire to lift trial restrictions.';
      } else if (swCode === '21408' || /permission to send/i.test(swMessage)) {
        hint = ' — The From number does not have permission to send to that destination in SignalWire.';
      } else if (swCode === '21610' || /unsubscribed/i.test(swMessage)) {
        hint = ' — Recipient has unsubscribed from this number in SignalWire (STOP).';
      }
      return new Response(
        JSON.stringify({
          success: false,
          error: detail + hint,
          provider: 'signalwire',
          provider_code: swCode || null,
          provider_status: response.status,
          provider_message: swMessage || null,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let messageSid = '';
    try {
      const result = JSON.parse(responseText);
      messageSid = result.sid || '';
    } catch { /* empty */ }

    // Log SMS
    await supabase.from('sms_logs').insert({
      company_id: companyId,
      from_number: signalwire_phone_number,
      to_number: normalizedPhone,
      message,
      direction: 'outbound',
      status: 'sent',
      metadata: {
        message_sid: messageSid,
        appointment_id: appointmentId || null,
        customer_name: customerName || null,
      },
    });

    return new Response(
      JSON.stringify({ success: true, messageSid }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Send SMS error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
