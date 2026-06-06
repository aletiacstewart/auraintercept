// Lightweight autonomy health probe — runs every 30 min via pg_cron.
// Spot-checks critical agent infra per active company and logs degradation
// to platform_issues so admins see autonomy gaps without manual checking.
import { createClient } from 'npm:@supabase/supabase-js@2';

const VERSION = 'v1.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startedAt = Date.now();
  console.log(`[cron-health-check ${VERSION}] starting sweep`);

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Sample active companies (cap to 100 to stay lightweight)
    const { data: companies, error: cErr } = await supabase
      .from('companies')
      .select('id, name, subscription_tier')
      .not('subscription_tier', 'is', null)
      .limit(100);

    if (cErr) throw cErr;

    let checked = 0;
    let degraded = 0;
    let unhealthy = 0;
    const issues: Array<{ company_id: string; status: string; reason: string }> = [];

    for (const company of companies ?? []) {
      checked++;
      try {
        const probe = await supabase.functions.invoke('ai-agent-health', {
          body: { company_id: company.id },
        });

        const status = (probe.data as any)?.status ?? 'unknown';
        if (status === 'unhealthy') {
          unhealthy++;
          const reason =
            (probe.data as any)?.checks?.database?.error ??
            'ai-agent-health returned unhealthy';
          issues.push({ company_id: company.id, status, reason });
        } else if (status === 'degraded') {
          degraded++;
          const checks = (probe.data as any)?.checks ?? {};
          const reasons: string[] = [];
          if (!checks?.api_keys?.openai) reasons.push('missing OpenAI key');
          if ((checks?.agents?.enabled ?? 0) === 0) reasons.push('no agents enabled');
          issues.push({
            company_id: company.id,
            status,
            reason: reasons.join('; ') || 'degraded',
          });
        }
      } catch (e) {
        unhealthy++;
        issues.push({
          company_id: company.id,
          status: 'unhealthy',
          reason: `probe failed: ${String(e)}`,
        });
      }
    }

    // Persist any unhealthy company as a low-noise platform issue
    for (const i of issues.filter((x) => x.status === 'unhealthy')) {
      try {
        await supabase.from('platform_issues').insert({
          issue_type: 'ai_agent_error',
          severity: 'medium',
          status: 'new',
          title: `Autonomy health: company ${i.company_id} unhealthy`,
          description: i.reason,
          metadata: { source: 'cron-health-check', version: VERSION },
        } as any);
      } catch (e) {
        console.error('[cron-health-check] failed to log issue:', e);
      }
    }

    const durationMs = Date.now() - startedAt;
    console.log(
      `[cron-health-check ${VERSION}] done — checked=${checked} degraded=${degraded} unhealthy=${unhealthy} duration=${durationMs}ms`
    );

    return new Response(
      JSON.stringify({
        ok: true,
        _version: VERSION,
        checked,
        degraded,
        unhealthy,
        duration_ms: durationMs,
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error(`[cron-health-check ${VERSION}] error:`, error);
    return new Response(
      JSON.stringify({ ok: false, error: String(error), _version: VERSION }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
