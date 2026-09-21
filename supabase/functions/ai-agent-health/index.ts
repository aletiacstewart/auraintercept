import { createClient } from 'npm:@supabase/supabase-js@2';
import { createLookupRegistry } from '../_shared/agent-registry.ts';

const VERSION = "v2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Health endpoint for the agent platform.
 *
 * Returns overall status plus per-agent health (enabled, configured, last seen,
 * 24h error rate and average latency) built from traced spans in
 * `ai_agent_logs`. Response keys from v1 are preserved so existing callers
 * (AIAgentTestSuite, cron-health-check) keep working.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let company_id: string | undefined;
    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      company_id = body?.company_id;
    } else {
      company_id = new URL(req.url).searchParams.get('company_id') ?? undefined;
    }

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
      .select('openai_api_key, elevenlabs_api_key, signalwire_project_id, resend_api_key, stripe_secret_key')
      .eq('company_id', company_id)
      .maybeSingle();

    // Last 24h of traced request spans, per agent
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: spans } = await supabase
      .from('ai_agent_logs')
      .select('agent_type, action, duration_ms, success, created_at')
      .eq('company_id', company_id)
      .gte('created_at', since)
      .limit(10000);

    type Stat = { requests: number; errors: number; total_ms: number; samples: number; last_seen: string | null };
    const stats = new Map<string, Stat>();
    for (const row of spans || []) {
      if (!row.agent_type || row.action !== 'request') continue;
      const s = stats.get(row.agent_type) ?? { requests: 0, errors: 0, total_ms: 0, samples: 0, last_seen: null };
      s.requests += 1;
      if (row.success === false) s.errors += 1;
      if (typeof row.duration_ms === 'number') { s.total_ms += row.duration_ms; s.samples += 1; }
      if (!s.last_seen || row.created_at > s.last_seen) s.last_seen = row.created_at;
      stats.set(row.agent_type, s);
    }

    const registry = createLookupRegistry();
    const configByType = new Map((agentConfigs || []).map((c: any) => [c.agent_type, c]));

    const agents = registry.list().map((agent) => {
      const cfg = configByType.get(agent.type);
      const s = stats.get(agent.type);
      const errorRate = s && s.requests ? Number(((s.errors / s.requests) * 100).toFixed(1)) : 0;
      const avgLatency = s && s.samples ? Math.round(s.total_ms / s.samples) : null;
      const unhealthy = errorRate > 5;
      return {
        agent_type: agent.type,
        name: agent.name,
        enabled: cfg ? cfg.is_enabled !== false : false,
        configured: !!cfg?.settings,
        requests_24h: s?.requests ?? 0,
        error_rate_24h: errorRate,
        avg_latency_ms: avgLatency,
        last_seen: s?.last_seen ?? null,
        status: !cfg ? 'not_configured' : unhealthy ? 'degraded' : 'ok',
      };
    });

    const totalAgents = agentConfigs?.length || 0;
    const enabledAgents = agentConfigs?.filter((a: any) => a.is_enabled).length || 0;
    const degradedAgents = agents.filter((a) => a.status === 'degraded');

    let status = 'healthy';
    if (dbError) status = 'unhealthy';
    else if (enabledAgents === 0 || degradedAgents.length > 0) status = 'degraded';

    console.log(`[${VERSION}] Health check for ${company_id}: ${status} (${degradedAgents.length} degraded)`);

    return new Response(
      JSON.stringify({
        status,
        timestamp: new Date().toISOString(),
        checks: {
          database: { status: dbError ? 'error' : 'ok', latency_ms: dbLatency, error: dbError?.message },
          agents: {
            total: totalAgents,
            enabled: enabledAgents,
            configured: agentConfigs?.filter((a: any) => a.settings).length || 0,
            degraded: degradedAgents.map((a) => a.agent_type),
            detail: agents,
          },
          api_keys: {
            openai: !!integrations?.openai_api_key,
            elevenlabs: !!integrations?.elevenlabs_api_key,
            signalwire: !!integrations?.signalwire_project_id,
            resend: !!integrations?.resend_api_key,
            stripe: !!integrations?.stripe_secret_key,
          },
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
