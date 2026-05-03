import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { loadCompanyWorkspace } from '../_shared/workspace.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * sync-company-workspace
 * Resolves the workspace for a company (industry blueprint + plan tier + overrides),
 * caches the resolved view onto `companies.supported_modules`, and re-runs the
 * tier/industry agent initializer so `ai_agent_configs` matches the new shape.
 *
 * Triggered by:
 *   - DB trigger trg_sync_company_workspace (industry/plan change)
 *   - manual call via supabase.functions.invoke('sync-company-workspace', { body: { company_id }})
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body = await req.json().catch(() => ({}));
    const companyId: string | undefined = body?.company_id;
    if (!companyId) {
      return new Response(JSON.stringify({ error: 'company_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Resolve workspace via shared helper
    const ctx = await loadCompanyWorkspace(companyId);

    // Pull blueprint extras (consoles + KPIs) since the shared helper
    // intentionally returns only prompt/agent/restriction context.
    const { data: company } = await admin
      .from('companies')
      .select('industry_vertical, subscription_tier, industry_config')
      .eq('id', companyId)
      .maybeSingle();

    let blueprint: any = null;
    if (company?.industry_vertical) {
      const { data: bp } = await admin
        .from('industry_blueprints')
        .select('default_consoles, default_kpis, primary_records')
        .eq('slug', company.industry_vertical)
        .eq('is_active', true)
        .maybeSingle();
      blueprint = bp;
    }

    const overrides = (company?.industry_config as Record<string, unknown>) ?? {};
    const supportedModules = {
      operating_model: ctx?.operatingModel ?? 'custom',
      active_consoles:
        (overrides.active_consoles as string[]) ??
        blueprint?.default_consoles ??
        ['business_mgmt', 'analytics'],
      kpis:
        (overrides.kpis as string[]) ??
        blueprint?.default_kpis ??
        [],
      primary_records:
        (overrides.primary_records as string[]) ??
        blueprint?.primary_records ??
        ['records'],
      restrictions: ctx?.restrictions ?? {},
      synced_at: new Date().toISOString(),
    };

    await admin
      .from('companies')
      .update({ supported_modules: supportedModules })
      .eq('id', companyId);

    // Re-run agent init so ai_agent_configs reflects the new tier+industry mix.
    try {
      await admin.functions.invoke('initialize-company-agents', {
        body: { company_id: companyId },
      });
    } catch (e) {
      console.warn('agent init invoke failed (non-fatal)', e);
    }

    return new Response(
      JSON.stringify({ ok: true, supported_modules: supportedModules }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('sync-company-workspace error', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});