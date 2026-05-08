const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('PLATFORM_ELEVENLABS_API_KEY');
    const agentId = Deno.env.get('PLATFORM_AURA_AGENT_ID');

    if (!apiKey) throw new Error('PLATFORM_ELEVENLABS_API_KEY not configured');
    if (!agentId) throw new Error('PLATFORM_AURA_AGENT_ID not configured');

    const tokenRes = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${agentId}`,
      { headers: { 'xi-api-key': apiKey } }
    );

    if (!tokenRes.ok) {
      const text = await tokenRes.text();
      console.error('ElevenLabs token error:', tokenRes.status, text);
      throw new Error(`ElevenLabs token request failed: ${tokenRes.status}`);
    }

    const { token } = await tokenRes.json();

    return new Response(
      JSON.stringify({ token, agentId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Aura token error:', message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});