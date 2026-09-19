import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { normalizeAgentName } from '@/lib/subscriptionAgentConfig';

export interface AgentMetrics {
  totalInteractions: number;
  successRate: number;
  avgSeconds: number | null;
}

export interface AgentMetricsResult {
  byAgent: Record<string, AgentMetrics>;
  totals: AgentMetrics;
}

const EMPTY: AgentMetricsResult = {
  byAgent: {},
  totals: { totalInteractions: 0, successRate: 0, avgSeconds: null },
};

/**
 * Real per-operative activity for the last 30 days, derived from ai_agent_events.
 * Legacy agent ids are normalized onto the canonical operative id so older rows
 * still count towards the operative that replaced them.
 */
export function useAgentPerformanceMetrics(companyId: string | null) {
  return useQuery<AgentMetricsResult>({
    queryKey: ['agent-performance-metrics', companyId],
    enabled: !!companyId,
    staleTime: 60_000,
    queryFn: async () => {
      if (!companyId) return EMPTY;
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('ai_agent_events')
        .select('source_agent, status, created_at, processed_at')
        .eq('company_id', companyId)
        .gte('created_at', since)
        .limit(5000);

      if (error) throw error;

      const buckets: Record<string, { total: number; ok: number; durations: number[] }> = {};
      for (const row of data ?? []) {
        const key = normalizeAgentName(row.source_agent) || row.source_agent;
        if (!key) continue;
        const bucket = (buckets[key] ??= { total: 0, ok: 0, durations: [] });
        bucket.total += 1;
        if (row.status !== 'failed') bucket.ok += 1;
        if (row.processed_at && row.created_at) {
          const secs = (new Date(row.processed_at).getTime() - new Date(row.created_at).getTime()) / 1000;
          if (Number.isFinite(secs) && secs >= 0) bucket.durations.push(secs);
        }
      }

      const byAgent: Record<string, AgentMetrics> = {};
      let total = 0;
      let ok = 0;
      const allDurations: number[] = [];
      for (const [key, b] of Object.entries(buckets)) {
        total += b.total;
        ok += b.ok;
        allDurations.push(...b.durations);
        byAgent[key] = {
          totalInteractions: b.total,
          successRate: b.total > 0 ? Math.round((b.ok / b.total) * 100) : 0,
          avgSeconds: b.durations.length
            ? b.durations.reduce((a, c) => a + c, 0) / b.durations.length
            : null,
        };
      }

      return {
        byAgent,
        totals: {
          totalInteractions: total,
          successRate: total > 0 ? Math.round((ok / total) * 100) : 0,
          avgSeconds: allDurations.length
            ? allDurations.reduce((a, c) => a + c, 0) / allDurations.length
            : null,
        },
      };
    },
  });
}

export function formatDuration(seconds: number | null): string {
  if (seconds === null) return '—';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

export function formatNumber(value: number): string {
  return value.toLocaleString();
}
