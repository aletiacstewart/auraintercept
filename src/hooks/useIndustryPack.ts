import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface IndustryPack {
  id: string;
  industry_id: string;
  cluster: 'trades' | 'outdoor' | 'repair' | 'booking';
  label: string;
  icon: string | null;
  description: string | null;
  dashboard_widgets: string[];
  job_templates: unknown[];
  appointment_rules: Record<string, unknown>;
  agent_prompt_deltas: Record<string, string>;
  extra_operatives: string[];
  min_tier_per_extra: Record<string, string>;
  form_schemas: Record<string, unknown>;
  checklist_library: unknown[];
  kb_seed_documents: unknown[];
  terminology: Record<string, string>;
  is_active: boolean;
}

const DEFAULT_PACK: IndustryPack = {
  id: '',
  industry_id: 'generic',
  cluster: 'trades',
  label: 'Service Business',
  icon: 'Building2',
  description: null,
  dashboard_widgets: [],
  job_templates: [],
  appointment_rules: {},
  agent_prompt_deltas: {},
  extra_operatives: [],
  min_tier_per_extra: {},
  form_schemas: {},
  checklist_library: [],
  kb_seed_documents: [],
  terminology: { job: 'Job', customer: 'Customer', appointment: 'Appointment' },
  is_active: true,
};

/**
 * Resolves the current company's industry template pack.
 * Returns the generic default pack if the company has no industry set
 * or the company's industry has no published pack yet.
 */
export function useIndustryPack(companyIdOverride?: string | null) {
  const { companyId: authCompanyId } = useAuth();
  const companyId = companyIdOverride ?? authCompanyId;
  const [pack, setPack] = useState<IndustryPack>(DEFAULT_PACK);
  const [loading, setLoading] = useState<boolean>(!!companyId);

  useEffect(() => {
    let cancelled = false;
    if (!companyId) {
      setPack(DEFAULT_PACK);
      setLoading(false);
      return;
    }
    setLoading(true);
    (async () => {
      const { data, error } = await supabase
        .rpc('get_company_industry_pack', { p_company_id: companyId });
      if (cancelled) return;
      if (error || !data) {
        setPack(DEFAULT_PACK);
      } else {
        const row = Array.isArray(data) ? data[0] : data;
        if (row && row.industry_id) {
          setPack({ ...DEFAULT_PACK, ...row } as IndustryPack);
        } else {
          setPack(DEFAULT_PACK);
        }
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [companyId]);

  return { pack, loading };
}

export const GENERIC_INDUSTRY_PACK = DEFAULT_PACK;