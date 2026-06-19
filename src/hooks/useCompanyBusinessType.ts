import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const cache = new Map<string, { businessType: string | null; industryVertical: string | null }>();

/**
 * Reads the company's stored business type (set at signup) plus the
 * canonical industry vertical. Either is used by per-business-type UI
 * (marketing matrix, channel chips, etc.).
 */
export function useCompanyBusinessType(companyIdOverride?: string | null) {
  const { companyId: authCompanyId } = useAuth();
  const companyId = companyIdOverride ?? authCompanyId;
  const cached = companyId ? cache.get(companyId) : null;
  const [data, setData] = useState(cached ?? { businessType: null, industryVertical: null });
  const [loading, setLoading] = useState(!!companyId && !cached);

  useEffect(() => {
    let cancelled = false;
    if (!companyId) {
      setData({ businessType: null, industryVertical: null });
      setLoading(false);
      return;
    }
    const hit = cache.get(companyId);
    if (hit) {
      setData(hit);
      setLoading(false);
      return;
    }
    setLoading(true);
    (async () => {
      const { data: row } = await supabase
        .from('companies')
        .select('industry_vertical, industry_config')
        .eq('id', companyId)
        .maybeSingle();
      if (cancelled) return;
      const cfg = (row?.industry_config ?? null) as { business_type?: string | null } | null;
      const resolved = {
        businessType: cfg?.business_type ?? null,
        industryVertical: (row?.industry_vertical as string | null) ?? null,
      };
      cache.set(companyId, resolved);
      setData(resolved);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [companyId]);

  return { ...data, loading };
}