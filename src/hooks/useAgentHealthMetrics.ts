import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type HealthRange = '24h' | '7d' | '30d';

export interface AgentHealthRow {
  agentType: string;
  requests: number;
  avgMs: number;
  p95Ms: number;
  successRate: number;
  errors: number;
  handoffs: number;
}

export interface AgentHealthAlert {
  id: string;
  title: string;
  description: string | null;
  severity: string;
  createdAt: string;
  agentType: string | null;
}

export interface AgentHealthResult {
  rows: AgentHealthRow[];
  alerts: AgentHealthAlert[];
}

const DAYS: Record<HealthRange, number> = { '24h': 1, '7d': 7, '30d': 30 };

/**
 * Per-agent request volume, latency and error rate from the daily rollup
 * (`agent_performance_metrics`), plus any open agent health alerts.
 */
export function useAgentHealthMetrics(companyId: string | null, range: HealthRange = '7d') {
  return useQuery<AgentHealthResult>({
    queryKey: ['agent-health-metrics', companyId, range],
    enabled: !!companyId,
    staleTime: 60_000,
    queryFn: async () => {
      if (!companyId) return { rows: [], alerts: [] };

      const since = new Date(Date.now() - DAYS[range] * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);

      const [{ data: metrics, error }, { data: issues }] = await Promise.all([
        supabase
          .from('agent_performance_metrics')
          .select('agent_type, date, requests_handled, avg_response_time_ms, p95_response_time_ms, success_rate, error_count, handoff_count')
          .eq('company_id', companyId)
          .gte('date', since),
        supabase
          .from('platform_issues')
          .select('id, title, description, severity, created_at, metadata')
          .eq('company_id', companyId)
          .eq('issue_type', 'ai_agent_error')
          .in('status', ['new', 'acknowledged', 'in_progress'])
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      if (error) throw error;

      const buckets = new Map<string, AgentHealthRow & { weightedAvg: number }>();
      for (const row of metrics ?? []) {
        const key = row.agent_type;
        const b = buckets.get(key) ?? {
          agentType: key,
          requests: 0,
          avgMs: 0,
          p95Ms: 0,
          successRate: 100,
          errors: 0,
          handoffs: 0,
          weightedAvg: 0,
        };
        const n = row.requests_handled ?? 0;
        b.requests += n;
        b.weightedAvg += (row.avg_response_time_ms ?? 0) * n;
        b.p95Ms = Math.max(b.p95Ms, row.p95_response_time_ms ?? 0);
        b.errors += row.error_count ?? 0;
        b.handoffs += row.handoff_count ?? 0;
        buckets.set(key, b);
      }

      const rows: AgentHealthRow[] = [...buckets.values()]
        .map((b) => ({
          agentType: b.agentType,
          requests: b.requests,
          avgMs: b.requests ? Math.round(b.weightedAvg / b.requests) : 0,
          p95Ms: b.p95Ms,
          errors: b.errors,
          handoffs: b.handoffs,
          successRate: b.requests
            ? Number((((b.requests - b.errors) / b.requests) * 100).toFixed(1))
            : 100,
        }))
        .sort((a, b) => b.requests - a.requests);

      const alerts: AgentHealthAlert[] = (issues ?? []).map((i: any) => ({
        id: i.id,
        title: i.title,
        description: i.description,
        severity: i.severity,
        createdAt: i.created_at,
        agentType: (i.metadata as any)?.agent_type ?? null,
      }));

      return { rows, alerts };
    },
  });
}
