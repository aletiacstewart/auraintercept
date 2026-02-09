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

    const {
      companyId,
      customerPhone,
      customerName,
      purpose = 'custom',
      appointmentDetails,
      customMessage,
    } = payload;

    if (!companyId) throw new Error('companyId is required');
    if (!customerPhone) throw new Error('customerPhone is required');
    if (!customerName) throw new Error('customerName is required');

    const normalizedPhone = normalizePhoneNumber(customerPhone);

    console.log(`Outbound call request: company=${companyId} phone=${normalizedPhone} purpose=${purpose}`);

    // Fetch SignalWire credentials
    const { data: integration, error: intError } = await supabase
      .from('tenant_integrations')
      .select('signalwire_project_id, signalwire_api_token, signalwire_phone_number, signalwire_space_url, elevenlabs_api_key, elevenlabs_voice_id')
      .eq('company_id', companyId)
      .maybeSingle();

    if (intError || !integration) {
      throw new Error('Integration settings not found');
    }

    const { signalwire_project_id, signalwire_api_token, signalwire_phone_number, signalwire_space_url } = integration;

    if (!signalwire_project_id || !signalwire_api_token || !signalwire_phone_number || !signalwire_space_url) {
      throw new Error('SignalWire credentials are not fully configured');
    }

    // Build call message
    let callMessage = customMessage || '';
    if (purpose === 'reminder' && appointmentDetails) {
      const dateStr = new Date(appointmentDetails.datetime).toLocaleString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit',
      });
      callMessage = `Hello ${customerName}, this is a reminder about your ${appointmentDetails.service} appointment on ${dateStr}. ${appointmentDetails.employeeName ? `Your technician will be ${appointmentDetails.employeeName}.` : ''} Press 1 to confirm, or 2 to request a callback.`;
    } else if (purpose === 'followup') {
      callMessage = `Hello ${customerName}, we're following up regarding your recent service. We'd love to hear about your experience. Press 1 if you were satisfied, or 2 to speak with a manager.`;
    } else if (!callMessage) {
      callMessage = `Hello ${customerName}, thank you for your time.`;
    }

    // Step 1: Pre-insert call_logs record to get an ID
    const { data: callLogEntry, error: insertError } = await supabase
      .from('call_logs')
      .insert({
        company_id: companyId,
        customer_name: customerName,
        customer_phone: normalizedPhone,
        from_number: signalwire_phone_number,
        to_number: normalizedPhone,
        direction: 'outbound',
        purpose,
        status: 'initiating',
        metadata: {
          call_message: callMessage,
          appointment_details: appointmentDetails || null,
        },
      })
      .select('id')
      .single();

    if (insertError || !callLogEntry) {
      console.error('Failed to insert call log:', insertError);
      throw new Error('Failed to create call log record');
    }

    const callLogId = callLogEntry.id;
    console.log(`Created call log: ${callLogId}`);

    // Step 2: Build short webhook URL
    const webhookUrl = `${supabaseUrl}/functions/v1/voice-handler?action=outbound&callLogId=${callLogId}`;
    const statusCallbackUrl = `${supabaseUrl}/functions/v1/voice-handler?action=status&callLogId=${callLogId}`;

    console.log(`Webhook URL length: ${webhookUrl.length} chars`);

    // Step 3: Call SignalWire Calls.json API
    const signalwireUrl = `https://${signalwire_space_url}/api/laml/2010-04-01/Accounts/${signalwire_project_id}/Calls.json`;
    const auth = btoa(`${signalwire_project_id}:${signalwire_api_token}`);

    const formData = new URLSearchParams();
    formData.append('Url', webhookUrl);
    formData.append('To', normalizedPhone);
    formData.append('From', signalwire_phone_number);
    formData.append('StatusCallback', statusCallbackUrl);
    formData.append('StatusCallbackEvent', 'initiated ringing answered completed');
    formData.append('StatusCallbackMethod', 'POST');

    console.log(`Calling SignalWire: ${signalwireUrl}`);

    const response = await fetch(signalwireUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: formData.toString(),
    });

    // Log all response headers for diagnostics
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });
    console.log('SignalWire response headers:', JSON.stringify(responseHeaders));
    console.log('SignalWire response status:', response.status);

    const responseText = await response.text();
    console.log('SignalWire response body:', responseText.substring(0, 500));

    if (!response.ok) {
      // Update call log with failure
      await supabase.from('call_logs').update({ status: 'failed', metadata: { error: responseText } }).eq('id', callLogId);
      throw new Error(`SignalWire API error: ${response.status} - ${responseText}`);
    }

    // Step 4: Parse response and extract call SID
    let callSid = '';
    if (responseText) {
      try {
        const result = JSON.parse(responseText);
        callSid = result.sid || result.call_sid || '';
      } catch {
        console.log('Could not parse SignalWire response as JSON');
      }
    }

    // Update call log with SID
    await supabase.from('call_logs').update({
      call_sid: callSid || null,
      status: 'initiated',
    }).eq('id', callLogId);

    console.log(`Call initiated successfully. SID: ${callSid || 'none'}, LogID: ${callLogId}`);

    return new Response(
      JSON.stringify({
        success: true,
        callSid: callSid || callLogId,
        callLogId,
        message: 'Call initiated successfully',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Outbound call error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
