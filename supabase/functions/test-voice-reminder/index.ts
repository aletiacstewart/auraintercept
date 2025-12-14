import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Get authorization header for user context
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create user-scoped client
    const userSupabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: userData, error: userError } = await userSupabase.auth.getUser();
    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { phoneNumber, callScript, companyId } = await req.json();

    if (!phoneNumber || !callScript || !companyId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: phoneNumber, callScript, companyId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Test call requested for company ${companyId} to ${phoneNumber}`);

    // Fetch company integrations
    const { data: integration, error: intErr } = await supabase
      .from('tenant_integrations')
      .select('twilio_account_sid, twilio_auth_token, twilio_phone_number, elevenlabs_api_key, elevenlabs_voice_id')
      .eq('company_id', companyId)
      .maybeSingle();

    if (intErr) {
      console.error('Error fetching integrations:', intErr);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch integrations' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!integration?.twilio_account_sid || !integration?.twilio_auth_token || !integration?.twilio_phone_number) {
      return new Response(
        JSON.stringify({ error: 'Twilio integration not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!integration?.elevenlabs_api_key) {
      return new Response(
        JSON.stringify({ error: 'ElevenLabs integration not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initiate test call via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${integration.twilio_account_sid}/Calls.json`;
    const authString = btoa(`${integration.twilio_account_sid}:${integration.twilio_auth_token}`);

    // Build the URL for the voice handler with context
    const voiceHandlerUrl = new URL(`${supabaseUrl}/functions/v1/voice-handler`);
    voiceHandlerUrl.searchParams.set('action', 'outbound');
    voiceHandlerUrl.searchParams.set('context', JSON.stringify({
      message: callScript,
      purpose: 'test_reminder',
      companyId: companyId,
    }));

    const formData = new URLSearchParams();
    formData.append('From', integration.twilio_phone_number);
    formData.append('To', phoneNumber);
    formData.append('Url', voiceHandlerUrl.toString());
    formData.append('StatusCallback', `${supabaseUrl}/functions/v1/voice-handler?action=status`);
    formData.append('StatusCallbackEvent', 'initiated ringing answered completed');

    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!twilioResponse.ok) {
      const errorText = await twilioResponse.text();
      console.error('Twilio error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to initiate call', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const twilioResult = await twilioResponse.json();
    console.log(`Test call initiated, SID: ${twilioResult.sid}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Test call initiated',
        callSid: twilioResult.sid,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in test-voice-reminder:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
