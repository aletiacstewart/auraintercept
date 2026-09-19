import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type HealthStatus = 'connected' | 'degraded' | 'error' | 'not_configured';

export interface IntegrationHealthRow {
  integration_name: string;
  status: HealthStatus;
  last_sync: string | null;
  error_message: string | null;
  checked_at: string;
}

export interface IntegrationHealthSummary extends IntegrationHealthRow {
  /** Share of checks in the last 30 days that came back healthy. */
  successRate: number | null;
  checks: number;
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export function useIntegrationHealth() {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['integration-health', companyId],
    enabled: !!companyId,
    queryFn: async (): Promise<IntegrationHealthSummary[]> => {
      const since = new Date(Date.now() - THIRTY_DAYS_MS).toISOString();
      const { data, error } = await supabase
        .from('integration_health_logs')
        .select('integration_name, status, last_sync, error_message, checked_at')
        .eq('company_id', companyId!)
        .gte('checked_at', since)
        .order('checked_at', { ascending: false })
        .limit(2000);
      if (error) throw error;

      const rows = (data ?? []) as IntegrationHealthRow[];
      const byName = new Map<string, IntegrationHealthRow[]>();
      rows.forEach((r) => {
        const list = byName.get(r.integration_name) ?? [];
        list.push(r);
        byName.set(r.integration_name, list);
      });

      return Array.from(byName.entries()).map(([name, list]) => {
        const latest = list[0];
        const healthy = list.filter((r) => r.status === 'connected').length;
        const lastGood = list.find((r) => r.status === 'connected');
        return {
          ...latest,
          integration_name: name,
          last_sync: latest.last_sync ?? lastGood?.checked_at ?? null,
          successRate: list.length ? Math.round((healthy / list.length) * 100) : null,
          checks: list.length,
        };
      });
    },
  });

  const recheck = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('check-integration-health', {
        body: {},
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integration-health', companyId] });
    },
  });

  return { ...query, recheck };
}
