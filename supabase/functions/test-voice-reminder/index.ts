import { createClient } from 'npm:@supabase/supabase-js@2';

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
      .select('signalwire_project_id, signalwire_api_token, signalwire_phone_number, signalwire_space_url, elevenlabs_api_key, elevenlabs_voice_id')
      .eq('company_id', companyId)
      .maybeSingle();

    if (intErr) {
      console.error('Error fetching integrations:', intErr);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch integrations' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!integration?.signalwire_project_id || !integration?.signalwire_api_token || !integration?.signalwire_phone_number || !integration?.signalwire_space_url) {
      return new Response(
        JSON.stringify({ error: 'SignalWire integration not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!integration?.elevenlabs_api_key) {
      return new Response(
        JSON.stringify({ error: 'ElevenLabs integration not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initiate test call via SignalWire
    const signalwireUrl = `https://${integration.signalwire_space_url}/api/laml/2010-04-01/Accounts/${integration.signalwire_project_id}/Calls`;
    const authString = btoa(`${integration.signalwire_project_id}:${integration.signalwire_api_token}`);

    // Build the URL for the voice handler with context
    const voiceHandlerUrl = new URL(`${supabaseUrl}/functions/v1/voice-handler`);
    voiceHandlerUrl.searchParams.set('action', 'outbound');
    voiceHandlerUrl.searchParams.set('context', JSON.stringify({
      message: callScript,
      purpose: 'test_reminder',
      companyId: companyId,
    }));

    const formData = new URLSearchParams();
    formData.append('From', integration.signalwire_phone_number);
    formData.append('To', phoneNumber);
    formData.append('Url', voiceHandlerUrl.toString());
    formData.append('StatusCallback', `${supabaseUrl}/functions/v1/voice-handler?action=status`);
    formData.append('StatusCallbackEvent', 'initiated ringing answered completed');

    const signalwireResponse = await fetch(signalwireUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!signalwireResponse.ok) {
      const errorText = await signalwireResponse.text();
      console.error('SignalWire error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to initiate call', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const signalwireResult = await signalwireResponse.json();
    console.log(`Test call initiated, SID: ${signalwireResult.sid}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Test call initiated',
        callSid: signalwireResult.sid,
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
