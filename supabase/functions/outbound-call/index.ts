import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OutboundCallRequest {
  companyId: string;
  customerPhone: string;
  customerName: string;
  purpose: 'reminder' | 'followup' | 'custom';
  appointmentDetails?: {
    service: string;
    datetime: string;
    employeeName?: string;
  };
  customMessage?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Safely parse request body
    let requestBody: OutboundCallRequest;
    try {
      const bodyText = await req.text();
      if (!bodyText || bodyText.trim() === '') {
        return new Response(
          JSON.stringify({ error: 'Request body is empty' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      requestBody = JSON.parse(bodyText);
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { 
      companyId, 
      customerPhone, 
      customerName,
      purpose, 
      appointmentDetails,
      customMessage 
    } = requestBody;

    if (!companyId || !customerPhone || !customerName || !purpose) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: companyId, customerPhone, customerName, purpose' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Initiating outbound call to ${customerPhone} for company ${companyId}`);

    // === SUBSCRIPTION TIER GATING FOR OUTBOUND CALLING ===
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .select('name, subscription_tier, trial_ends_at')
      .eq('id', companyId)
      .single();

    if (companyError) {
      console.error('Company not found:', companyError);
      return new Response(
        JSON.stringify({ error: 'Company not found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const subscriptionTier = companyData?.subscription_tier || 'free';
    const trialEndsAt = companyData?.trial_ends_at;
    const inTrial = trialEndsAt && new Date(trialEndsAt) > new Date();

    // Outbound calling available for Halo and all paid tiers above
    const voiceTiers = ['halo', 'single_point', 'multi_track', 'command'];
    const hasVoiceAccess = inTrial || voiceTiers.includes(subscriptionTier);

    if (!hasVoiceAccess) {
      console.log(`[Outbound Call] Voice locked for company ${companyId}: tier=${subscriptionTier}, trial=${inTrial}`);
      return new Response(
        JSON.stringify({ 
          error: 'voice_locked',
          message: 'Outbound calling requires a paid subscription (Single-Point or higher).',
          current_tier: subscriptionTier,
          required_tier: 'single_point'
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get SignalWire credentials
    const { data: integration, error: integrationError } = await supabase
      .from('tenant_integrations')
      .select('signalwire_project_id, signalwire_api_token, signalwire_phone_number, signalwire_space_url, elevenlabs_api_key, elevenlabs_voice_id')
      .eq('company_id', companyId)
      .single();

    if (integrationError || !integration?.signalwire_project_id) {
      console.error('Integration not found:', integrationError);
      return new Response(
        JSON.stringify({ error: 'SignalWire integration not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!integration.signalwire_phone_number) {
      return new Response(
        JSON.stringify({ error: 'SignalWire phone number not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!integration.signalwire_space_url) {
      return new Response(
        JSON.stringify({ error: 'SignalWire space URL not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const company = companyData;

    // Build the call message based on purpose
    let callMessage = '';
    switch (purpose) {
      case 'reminder':
        if (appointmentDetails) {
          const date = new Date(appointmentDetails.datetime);
          const formattedDate = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
          const formattedTime = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
          callMessage = `Hello ${customerName}, this is a reminder from ${company?.name || 'us'}. You have an appointment for ${appointmentDetails.service} scheduled on ${formattedDate} at ${formattedTime}${appointmentDetails.employeeName ? ` with ${appointmentDetails.employeeName}` : ''}. Press 1 to confirm, or press 2 to reschedule or cancel.`;
        } else {
          callMessage = `Hello ${customerName}, this is a reminder from ${company?.name || 'us'} about your upcoming appointment. Press 1 to confirm, or press 2 to speak with someone about rescheduling.`;
        }
        break;
      case 'followup':
        callMessage = `Hello ${customerName}, this is ${company?.name || 'us'} calling to follow up on your recent visit. We hope everything went well! Press 1 if you'd like to schedule another appointment, or press 2 to speak with someone.`;
        break;
      case 'custom':
        callMessage = customMessage || `Hello ${customerName}, this is ${company?.name || 'us'} calling. Please hold while we connect you.`;
        break;
    }

    // Store call context for the voice handler
    const callContext = {
      purpose,
      customerName,
      customerPhone,
      companyId,
      appointmentDetails,
      message: callMessage,
    };

    // Encode context to pass via URL
    const encodedContext = encodeURIComponent(JSON.stringify(callContext));

    // Format phone number - ensure it has country code
    let formattedPhone = customerPhone.replace(/\D/g, ''); // Remove non-digits
    if (!formattedPhone.startsWith('1') && formattedPhone.length === 10) {
      formattedPhone = '1' + formattedPhone; // Add US country code
    }
    formattedPhone = '+' + formattedPhone;

    // Initiate the call via SignalWire
    const signalwireUrl = `https://${integration.signalwire_space_url}/api/laml/2010-04-01/Accounts/${integration.signalwire_project_id}/Calls`;
    
    const formData = new URLSearchParams();
    formData.append('To', formattedPhone);
    formData.append('From', integration.signalwire_phone_number);
    formData.append('Url', `${SUPABASE_URL}/functions/v1/voice-handler?action=outbound&context=${encodedContext}`);
    formData.append('StatusCallback', `${SUPABASE_URL}/functions/v1/voice-handler?action=status`);
    formData.append('StatusCallbackEvent', 'initiated ringing answered completed');
    formData.append('Timeout', '30');

    const authHeader = btoa(`${integration.signalwire_project_id}:${integration.signalwire_api_token}`);
    
    console.log(`Calling SignalWire API: ${signalwireUrl}`);
    console.log(`From: ${integration.signalwire_phone_number}, To: ${formattedPhone}`);
    
    const signalwireResponse = await fetch(signalwireUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    // Handle potential empty or non-JSON responses from SignalWire
    const responseText = await signalwireResponse.text();
    console.log(`SignalWire response status: ${signalwireResponse.status}, body: ${responseText.substring(0, 500)}`);
    
    let signalwireData: Record<string, unknown> = {};
    
    if (responseText && responseText.trim()) {
      try {
        signalwireData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse SignalWire response as JSON:', responseText);
        // Check if it's XML (SignalWire sometimes returns XML errors)
        if (responseText.includes('<') && responseText.includes('>')) {
          return new Response(
            JSON.stringify({ 
              error: 'SignalWire returned XML error', 
              details: responseText.substring(0, 500),
              status: signalwireResponse.status
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        return new Response(
          JSON.stringify({ 
            error: 'Invalid response from SignalWire', 
            details: responseText.substring(0, 200),
            status: signalwireResponse.status
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      console.error('Empty response from SignalWire, status:', signalwireResponse.status);
      return new Response(
        JSON.stringify({ 
          error: 'Empty response from SignalWire - check credentials and phone number format', 
          status: signalwireResponse.status,
          to: formattedPhone,
          from: integration.signalwire_phone_number
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!signalwireResponse.ok) {
      console.error('SignalWire error:', signalwireData);
      return new Response(
        JSON.stringify({ error: 'Failed to initiate call', details: signalwireData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Call initiated successfully:', signalwireData.sid);

    // Log the outbound call
    const { error: logError } = await supabase
      .from('call_logs')
      .insert({
        company_id: companyId,
        direction: 'outbound',
        status: 'initiated',
        from_number: integration.signalwire_phone_number,
        to_number: customerPhone,
        customer_name: customerName,
        customer_phone: customerPhone,
        call_sid: signalwireData.sid,
        purpose,
        metadata: { appointmentDetails },
      });

    if (logError) {
      console.error('Error logging call:', logError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        callSid: signalwireData.sid,
        status: signalwireData.status,
        message: 'Call initiated successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('Outbound call error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
