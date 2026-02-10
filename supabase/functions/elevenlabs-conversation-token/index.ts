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

    // Fetch both WebRTC token and WebSocket signed_url in parallel
    const [tokenRes, signedUrlRes] = await Promise.all([
      fetch(
        `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${elevenLabsAgentId}`,
        { headers: { 'xi-api-key': elevenLabsApiKey } }
      ),
      fetch(
        `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${elevenLabsAgentId}`,
        { headers: { 'xi-api-key': elevenLabsApiKey } }
      ),
    ]);

    const tokenText = await tokenRes.text();
    const signedUrlText = await signedUrlRes.text();

    let token: string | undefined;
    let signed_url: string | undefined;

    if (tokenRes.ok) {
      try {
        const parsed = JSON.parse(tokenText);
        token = parsed.token;
      } catch {
        console.error('Failed to parse token response:', tokenText);
      }
    } else {
      console.error('ElevenLabs token error:', tokenRes.status, tokenText);
    }

    if (signedUrlRes.ok) {
      try {
        const parsed = JSON.parse(signedUrlText);
        signed_url = parsed.signed_url;
      } catch {
        console.error('Failed to parse signed_url response:', signedUrlText);
      }
    } else {
      console.error('ElevenLabs signed_url error:', signedUrlRes.status, signedUrlText);
    }

    if (!token && !signed_url) {
      throw new Error('Failed to get both token and signed_url from ElevenLabs');
    }

    return new Response(
      JSON.stringify({ token, signed_url, agentId: elevenLabsAgentId }),
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
