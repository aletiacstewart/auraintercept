import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

/**
 * Runtime feature switches.
 *
 * A row with `company_id = null` is the global default; a row for a specific
 * company overrides it. `rollout_percentage` is evaluated once per browser
 * session (stable seed) so the UI never flips while someone is using it.
 */
export type FeatureFlagName =
  | 'unified_analytics_enabled'
  | 'new_agent_hub_enabled'
  | 'first_steps_onboarding_enabled'
  | 'industry_specific_paths_enabled'
  | 'new_integration_wizard_enabled';

export type FeatureFlagMap = Partial<Record<FeatureFlagName, boolean>> & Record<string, boolean>;

const SEED_KEY = 'aura_flag_seed';

/** Stable 0–99 bucket for this browser session. */
function sessionBucket(): number {
  try {
    let seed = sessionStorage.getItem(SEED_KEY);
    if (!seed) {
      seed = String(Math.floor(Math.random() * 100));
      sessionStorage.setItem(SEED_KEY, seed);
    }
    const n = Number(seed);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

export const useFeatureFlags = (): FeatureFlagMap => {
  const { companyId } = useAuth();

  const { data } = useQuery({
    queryKey: ['feature-flags', companyId ?? 'global'],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<FeatureFlagMap> => {
      let query = supabase
        .from('feature_flags')
        .select('flag_name, enabled, rollout_percentage, company_id');

      query = companyId
        ? query.or(`company_id.is.null,company_id.eq.${companyId}`)
        : query.is('company_id', null);

      const { data, error } = await query;
      if (error) throw error;

      const bucket = sessionBucket();
      const resolved: FeatureFlagMap = {};
      const scoped = new Set<string>();

      for (const row of data ?? []) {
        const isCompanyRow = !!row.company_id;
        // Company-specific rows always win over global defaults.
        if (!isCompanyRow && scoped.has(row.flag_name)) continue;
        if (isCompanyRow) scoped.add(row.flag_name);

        const pct = row.rollout_percentage ?? 100;
        resolved[row.flag_name] = !!row.enabled && bucket < pct;
      }

      return resolved;
    },
  });

  return data ?? {};
};

/** Convenience helper for a single switch. */
export const useFeatureFlag = (name: FeatureFlagName): boolean => {
  const flags = useFeatureFlags();
  return !!flags[name];
};
