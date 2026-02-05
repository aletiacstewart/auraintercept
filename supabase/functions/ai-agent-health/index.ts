import { createClient } from 'npm:@supabase/supabase-js@2';

const VERSION = "v1.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  console.log(`[${VERSION}] Health check request received`);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { company_id } = await req.json();

    if (!company_id) {
      return new Response(
        JSON.stringify({ error: 'company_id is required', _version: VERSION }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const dbStart = Date.now();
    const { data: agentConfigs, error: dbError } = await supabase
      .from('ai_agent_configs')
      .select('agent_type, is_enabled, settings')
      .eq('company_id', company_id);
    const dbLatency = Date.now() - dbStart;

    const { data: integrations } = await supabase
      .from('tenant_integrations')
      .select('openai_api_key, elevenlabs_api_key')
      .eq('company_id', company_id)
      .single();

    const totalAgents = agentConfigs?.length || 0;
    const enabledAgents = agentConfigs?.filter(a => a.is_enabled).length || 0;

    let status = 'healthy';
    if (dbError) status = 'unhealthy';
    else if (enabledAgents === 0 || !integrations?.openai_api_key) status = 'degraded';

    console.log(`[${VERSION}] Health check completed: ${status}`);

    return new Response(
      JSON.stringify({
        status,
        timestamp: new Date().toISOString(),
        checks: {
          database: { status: dbError ? 'error' : 'ok', latency_ms: dbLatency, error: dbError?.message },
          agents: { total: totalAgents, enabled: enabledAgents, configured: agentConfigs?.filter(a => a.settings).length || 0 },
          api_keys: { openai: !!integrations?.openai_api_key, elevenlabs: !!integrations?.elevenlabs_api_key },
        },
        _version: VERSION,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error(`[${VERSION}] Error:`, error);
    return new Response(
      JSON.stringify({ status: 'unhealthy', error: String(error), timestamp: new Date().toISOString(), _version: VERSION }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
