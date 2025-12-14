import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { 
      companyId, 
      customerPhone, 
      customerName,
      purpose, 
      appointmentDetails,
      customMessage 
    }: OutboundCallRequest = await req.json();

    console.log(`Initiating outbound call to ${customerPhone} for company ${companyId}`);

    // Get Twilio credentials
    const { data: integration, error: integrationError } = await supabase
      .from('tenant_integrations')
      .select('twilio_account_sid, twilio_auth_token, twilio_phone_number, elevenlabs_api_key, elevenlabs_voice_id')
      .eq('company_id', companyId)
      .single();

    if (integrationError || !integration?.twilio_account_sid) {
      console.error('Integration not found:', integrationError);
      return new Response(
        JSON.stringify({ error: 'Twilio integration not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get company name
    const { data: company } = await supabase
      .from('companies')
      .select('name')
      .eq('id', companyId)
      .single();

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

    // Initiate the call via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${integration.twilio_account_sid}/Calls.json`;
    
    const formData = new URLSearchParams();
    formData.append('To', customerPhone);
    formData.append('From', integration.twilio_phone_number!);
    formData.append('Url', `${SUPABASE_URL}/functions/v1/voice-handler?action=outbound&context=${encodedContext}`);
    formData.append('StatusCallback', `${SUPABASE_URL}/functions/v1/voice-handler?action=status`);
    formData.append('StatusCallbackEvent', 'initiated ringing answered completed');
    formData.append('Timeout', '30');

    const authHeader = btoa(`${integration.twilio_account_sid}:${integration.twilio_auth_token}`);
    
    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const twilioData = await twilioResponse.json();

    if (!twilioResponse.ok) {
      console.error('Twilio error:', twilioData);
      return new Response(
        JSON.stringify({ error: 'Failed to initiate call', details: twilioData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Call initiated successfully:', twilioData.sid);

    return new Response(
      JSON.stringify({ 
        success: true, 
        callSid: twilioData.sid,
        status: twilioData.status,
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
