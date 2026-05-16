import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { resolveCompanyWorkspace } from '@/lib/workspace/resolveCompanyWorkspace';
import type {
  CompanyForResolver,
  IndustryBlueprint,
  ResolvedWorkspace,
} from '@/lib/workspace/types';

interface UseWorkspaceResult {
  workspace: ResolvedWorkspace | null;
  loading: boolean;
  error: string | null;
}

// Module-level cache keyed by companyId so navigation between dashboard
// routes doesn't briefly reset workspace to null (which would flicker
// industry-aware sidebar labels back to generic defaults).
const workspaceCache = new Map<string, ResolvedWorkspace>();

export function useWorkspace(companyIdOverride?: string | null): UseWorkspaceResult {
  const { companyId: authCompanyId } = useAuth();
  const companyId = companyIdOverride ?? authCompanyId;
  const [workspace, setWorkspace] = useState<ResolvedWorkspace | null>(
    () => (companyId && workspaceCache.get(companyId)) || null
  );
  const [loading, setLoading] = useState<boolean>(
    !!companyId && !workspaceCache.has(companyId)
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!companyId) {
      setWorkspace(null);
      setLoading(false);
      return;
    }
    const cached = workspaceCache.get(companyId);
    if (cached) {
      setWorkspace(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }
    (async () => {
      try {
        const { data: company, error: cErr } = await supabase
          .from('companies')
          .select(
            'id, industry_vertical, operating_model, industry_config, secondary_industries, subscription_tier',
          )
          .eq('id', companyId)
          .maybeSingle();
        if (cErr) throw cErr;

        let blueprint: IndustryBlueprint | null = null;
        if (company?.industry_vertical) {
          const { data: bp } = await supabase
            .from('industry_blueprints' as never)
            .select('*')
            .eq('slug', company.industry_vertical)
            .eq('is_active', true)
            .maybeSingle();
          blueprint = (bp as IndustryBlueprint | null) ?? null;
        }

        if (cancelled) return;
        const resolved = resolveCompanyWorkspace(
          company as CompanyForResolver,
          blueprint,
        );
        workspaceCache.set(companyId, resolved);
        setWorkspace(resolved);
        setError(null);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  return { workspace, loading, error };
}