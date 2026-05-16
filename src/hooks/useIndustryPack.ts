import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface IndustryPack {
  id: string;
  industry_id: string;
  cluster: 'trades' | 'outdoor' | 'repair' | 'booking' | 'home_health';
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
  console_visibility: ConsoleVisibility;
  // v2 additions
  service_catalog: ServiceCatalogEntry[];
  service_type_options: string[];
  customer_intake_schema: { fields?: IntakeField[] };
  inventory_taxonomy: { label?: string; categories?: string[]; units?: string[] };
  quote_template: Record<string, unknown>;
  invoice_template: Record<string, unknown>;
}

export interface ServiceCatalogEntry {
  name: string;
  category?: string;
  default_duration_minutes?: number;
  default_service_type?: string;
}

export interface IntakeField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'date' | 'number' | 'boolean' | 'json';
  required?: boolean;
}

export type FieldOpsMode = 'full' | 'route_mode' | 'booking_mode' | 'hidden';

export interface ConsoleVisibility {
  field_ops?: FieldOpsMode;
  dispatch_map?: boolean;
  truck_inventory?: boolean;
  emergency_queue?: boolean;
  permit_tracker?: boolean;
  site_survey?: boolean;
  bay_scheduler?: boolean;
  route_map?: boolean;
  receptionist?: boolean;
  reservation_table?: boolean;
  showings_calendar?: boolean;
  chair_grid?: boolean;
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
  console_visibility: { field_ops: 'full', dispatch_map: true, truck_inventory: true, emergency_queue: true },
  service_catalog: [],
  service_type_options: [],
  customer_intake_schema: {},
  inventory_taxonomy: {},
  quote_template: {},
  invoice_template: {},
};

// Module-level caches keyed by companyId. They survive component remounts
// (e.g. when navigating between dashboard routes), so the sidebar/labels
// don't briefly fall back to generic defaults and "flash" before the next
// fetch resolves.
const packCache = new Map<string, IndustryPack>();
const publicPackCache = new Map<string, IndustryPack>();

/**
 * Resolves the current company's industry template pack.
 * Returns the generic default pack if the company has no industry set
 * or the company's industry has no published pack yet.
 */
export function useIndustryPack(companyIdOverride?: string | null) {
  const { companyId: authCompanyId } = useAuth();
  const companyId = companyIdOverride ?? authCompanyId;
  const [pack, setPack] = useState<IndustryPack>(
    () => (companyId && packCache.get(companyId)) || DEFAULT_PACK
  );
  const [loading, setLoading] = useState<boolean>(
    !!companyId && !packCache.has(companyId)
  );

  useEffect(() => {
    let cancelled = false;
    if (!companyId) {
      setPack(DEFAULT_PACK);
      setLoading(false);
      return;
    }
    const cached = packCache.get(companyId);
    if (cached) {
      setPack(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }
    (async () => {
      const { data, error } = await supabase
        .rpc('get_company_industry_pack', { p_company_id: companyId });
      if (cancelled) return;
      if (error || !data) {
        if (!packCache.has(companyId)) setPack(DEFAULT_PACK);
      } else {
        const row = Array.isArray(data) ? data[0] : data;
        if (row && row.industry_id) {
          const next = { ...DEFAULT_PACK, ...row } as IndustryPack;
          packCache.set(companyId, next);
          setPack(next);
        } else {
          if (!packCache.has(companyId)) setPack(DEFAULT_PACK);
        }
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [companyId]);

  return { pack, loading };
}

/**
 * Unauthenticated variant for public booking widgets / smart website embeds.
 * Calls the SECURITY DEFINER RPC `get_public_industry_pack` which returns
 * only the safe subset (industry_id, label, job_templates, form_schemas,
 * terminology) — no prompt deltas or tier gating data.
 */
export function usePublicIndustryPack(companyId: string | null | undefined) {
  const [pack, setPack] = useState<IndustryPack>(
    () => (companyId && publicPackCache.get(companyId)) || DEFAULT_PACK
  );
  const [loading, setLoading] = useState<boolean>(
    !!companyId && !publicPackCache.has(companyId)
  );

  useEffect(() => {
    let cancelled = false;
    if (!companyId) {
      setPack(DEFAULT_PACK);
      setLoading(false);
      return;
    }
    const cached = publicPackCache.get(companyId);
    if (cached) {
      setPack(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }
    (async () => {
      const { data, error } = await supabase
        .rpc('get_public_industry_pack', { p_company_id: companyId });
      if (cancelled) return;
      if (error || !data) {
        if (!publicPackCache.has(companyId)) setPack(DEFAULT_PACK);
      } else {
        const row = Array.isArray(data) ? data[0] : data;
        if (row && row.industry_id) {
          const next = { ...DEFAULT_PACK, ...(row as unknown as Partial<IndustryPack>) } as IndustryPack;
          publicPackCache.set(companyId, next);
          setPack(next);
        } else {
          if (!publicPackCache.has(companyId)) setPack(DEFAULT_PACK);
        }
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [companyId]);

  return { pack, loading };
}

export const GENERIC_INDUSTRY_PACK = DEFAULT_PACK;