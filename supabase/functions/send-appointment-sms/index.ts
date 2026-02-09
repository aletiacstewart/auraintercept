import { createClient } from "npm:@supabase/supabase-js@2";

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

    const { companyId, customerPhone, customerName, message, appointmentId } = payload;

    if (!companyId) throw new Error('companyId is required');
    if (!customerPhone) throw new Error('customerPhone is required');
    if (!message) throw new Error('message is required');

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
      throw new Error(`Failed to send SMS: ${response.status}`);
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
