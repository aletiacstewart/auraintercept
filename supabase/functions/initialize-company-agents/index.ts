import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mirror src/lib/subscriptionAgentConfig.ts and seed-demo-accounts-v2.
// Written in the consolidated 10-operative model. Legacy granular IDs are
// also enabled so older code paths keep working.
const TIER_AGENTS: Record<string, string[]> = {
  starter: [
    'triage', 'customer_journey', 'outreach', 'creative_content', 'web_presence',
    'booking', 'followup', 'review', 'lead', 'marketing',
  ],
  connect: [
    'triage', 'customer_journey', 'outreach', 'creative_content', 'web_presence',
    'dispatch', 'field_navigation',
    'booking', 'followup', 'review', 'lead', 'marketing',
    'route', 'eta', 'checkin',
  ],
  performance: [
    'triage', 'customer_journey', 'outreach', 'creative_content', 'web_presence',
    'dispatch', 'field_navigation', 'business_finance', 'analytics_intelligence',
    'booking', 'followup', 'review', 'lead', 'marketing',
    'route', 'eta', 'checkin',
    'campaign', 'social_scheduler', 'social_analytics',
    'quoting', 'invoice',
  ],
  command: [
    'triage', 'customer_journey', 'outreach', 'creative_content', 'web_presence',
    'dispatch', 'field_navigation', 'admin', 'business_finance', 'analytics_intelligence',
    'booking', 'followup', 'review',
    'route', 'eta', 'checkin',
    'quoting', 'invoice', 'inventory',
    'campaign', 'lead', 'outreach', 'marketing',
    'social_scheduler', 'social_analytics',
    'insights', 'performance', 'revenue', 'forecast',
  ],
};

// Map any legacy/external tier name to canonical 4-tier IDs.
const TIER_ALIASES: Record<string, string> = {
  starter: 'starter', core: 'starter', aura_core: 'starter', aura_starter: 'starter',
  express: 'starter', aura_flow: 'starter', halo: 'starter', scheduling: 'starter',
  connect: 'connect', boost: 'connect', aura_boost: 'connect', aura_connect: 'connect',
  growth: 'connect', business: 'connect', aura_growth: 'connect',
  performance: 'performance', pro: 'performance', aura_pro: 'performance',
  single_point: 'performance', multi_track: 'performance', field_ops: 'performance',
  command: 'command', elite: 'command', aura_elite: 'command',
};

function normalizeTier(t: string | null | undefined): string {
  if (!t) return 'starter';
  return TIER_ALIASES[t.toLowerCase()] ?? 'starter';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body = await req.json().catch(() => ({}));
    const companyId: string | undefined = body?.company_id;
    const allCompanies: boolean = body?.all_companies === true;

    let companies: Array<{ id: string; subscription_tier: string | null; industry_vertical: string | null }> = [];

    if (allCompanies) {
      const { data, error } = await admin
        .from('companies')
        .select('id, subscription_tier, industry_vertical');
      if (error) throw error;
      companies = data ?? [];
    } else {
      if (!companyId) {
        return new Response(JSON.stringify({ error: 'company_id required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { data, error } = await admin
        .from('companies')
        .select('id, subscription_tier, industry_vertical')
        .eq('id', companyId)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        return new Response(JSON.stringify({ error: 'company not found' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      companies = [data];
    }

    const results: Array<{ company_id: string; activated: number; tier: string }> = [];

    for (const c of companies) {
      const tier = normalizeTier(c.subscription_tier);
      const tierAgents = TIER_AGENTS[tier] ?? TIER_AGENTS.starter;

      // Industry extras
      let extras: string[] = [];
      if (c.industry_vertical) {
        const { data: pack } = await admin
          .from('industry_template_packs')
          .select('extra_operatives')
          .eq('industry_id', c.industry_vertical)
          .eq('is_active', true)
          .maybeSingle();
        if (Array.isArray(pack?.extra_operatives)) {
          extras = pack!.extra_operatives as string[];
        }
      }

      const all = Array.from(new Set([...tierAgents, ...extras]));

      // Upsert each row as enabled. Do not delete other rows so we never
      // disable something an admin manually toggled on.
      const rows = all.map(agent_type => ({
        company_id: c.id,
        agent_type,
        is_enabled: true,
        settings: {},
      }));

      if (rows.length > 0) {
        const { error: upsertErr } = await admin
          .from('ai_agent_configs')
          .upsert(rows, { onConflict: 'company_id,agent_type' });
        if (upsertErr) {
          console.error(`Init failed for ${c.id}:`, upsertErr.message);
          continue;
        }
      }

      results.push({ company_id: c.id, activated: rows.length, tier });
    }

    return new Response(JSON.stringify({ success: true, count: results.length, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('initialize-company-agents error:', msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});