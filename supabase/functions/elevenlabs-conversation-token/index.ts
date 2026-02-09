import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const bodyText = await req.text();
    let payload: any = {};
    try {
      if (bodyText) payload = JSON.parse(bodyText);
    } catch { /* empty body ok */ }

    const companyId = payload.companyId || payload.company_id;
    const agentId = payload.agentId || payload.agent_id;

    if (!companyId && !agentId) {
      throw new Error('companyId or agentId is required');
    }

    let elevenLabsAgentId = agentId || '';
    let elevenLabsApiKey = '';

    if (companyId) {
      const { data: integration, error } = await supabase
        .from('tenant_integrations')
        .select('elevenlabs_api_key, elevenlabs_agent_id')
        .eq('company_id', companyId)
        .maybeSingle();

      if (error || !integration?.elevenlabs_api_key) {
        throw new Error('ElevenLabs integration not configured');
      }

      elevenLabsApiKey = integration.elevenlabs_api_key;
      elevenLabsAgentId = elevenLabsAgentId || integration.elevenlabs_agent_id || '';
    }

    if (!elevenLabsAgentId) {
      throw new Error('ElevenLabs agent ID not configured');
    }

    if (!elevenLabsApiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    // Get conversation token from ElevenLabs
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${elevenLabsAgentId}`,
      {
        headers: { 'xi-api-key': elevenLabsApiKey },
      }
    );

    const responseText = await response.text();

    if (!response.ok) {
      console.error('ElevenLabs token error:', response.status, responseText);
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    let tokenData: any;
    try {
      tokenData = JSON.parse(responseText);
    } catch {
      throw new Error('Invalid response from ElevenLabs');
    }

    return new Response(
      JSON.stringify({ token: tokenData.token, agentId: elevenLabsAgentId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Conversation token error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
