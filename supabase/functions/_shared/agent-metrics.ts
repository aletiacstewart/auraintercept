/**
 * Metrics collector: rolls traced spans up into `agent_performance_metrics`
 * (one row per company / agent / day). Called from the existing two-minute
 * worker, so there is no extra cron job.
 */

export interface AgentDayMetrics {
  company_id: string;
  agent_type: string;
  date: string;
  requests_handled: number;
  avg_response_time_ms: number;
  p95_response_time_ms: number;
  success_rate: number;
  error_count: number;
  handoff_count: number;
}

export function percentile(values: number[], p: number): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return Math.round(sorted[Math.max(0, idx)]);
}

/** Rows written by the tracer for a window, grouped per agent. */
export async function collectAgentMetrics(
  supabase: any,
  opts: { since: Date; until?: Date; companyId?: string | null },
): Promise<AgentDayMetrics[]> {
  const until = opts.until ?? new Date();
  let query = supabase
    .from('ai_agent_logs')
    .select('company_id, agent_type, span_name, action, duration_ms, success, created_at')
    .gte('created_at', opts.since.toISOString())
    .lte('created_at', until.toISOString())
    .limit(10000);

  if (opts.companyId) query = query.eq('company_id', opts.companyId);

  const { data, error } = await query;
  if (error) throw error;

  type Bucket = { durations: number[]; requests: number; errors: number; handoffs: number };
  const buckets = new Map<string, Bucket>();

  for (const row of data || []) {
    if (!row.company_id || !row.agent_type) continue;
    const day = String(row.created_at).slice(0, 10);
    const key = `${row.company_id}|${row.agent_type}|${day}`;
    const b = buckets.get(key) ?? { durations: [], requests: 0, errors: 0, handoffs: 0 };

    const isRequest = row.action === 'request';
    const isHandoff = typeof row.span_name === 'string' && row.span_name.startsWith('handoff.');

    if (isRequest) {
      b.requests += 1;
      if (typeof row.duration_ms === 'number') b.durations.push(row.duration_ms);
      if (row.success === false) b.errors += 1;
    }
    if (isHandoff) b.handoffs += 1;

    buckets.set(key, b);
  }

  const out: AgentDayMetrics[] = [];
  for (const [key, b] of buckets) {
    const [company_id, agent_type, date] = key.split('|');
    if (!b.requests) continue;
    const avg = b.durations.length
      ? Math.round(b.durations.reduce((s, d) => s + d, 0) / b.durations.length)
      : 0;
    out.push({
      company_id,
      agent_type,
      date,
      requests_handled: b.requests,
      avg_response_time_ms: avg,
      p95_response_time_ms: percentile(b.durations, 95),
      success_rate: Number((((b.requests - b.errors) / b.requests) * 100).toFixed(2)),
      error_count: b.errors,
      handoff_count: b.handoffs,
    });
  }
  return out;
}

/** Upsert today's rollup. Returns how many agent/day rows were written. */
export async function rollUpAgentMetrics(
  supabase: any,
  opts: { companyId?: string | null; lookbackMinutes?: number } = {},
): Promise<number> {
  // Recompute the whole current day so the upsert stays correct regardless of
  // how many worker passes ran.
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const metrics = await collectAgentMetrics(supabase, {
    since: startOfDay,
    companyId: opts.companyId ?? null,
  });
  if (!metrics.length) return 0;

  const { error } = await supabase
    .from('agent_performance_metrics')
    .upsert(
      metrics.map((m) => ({ ...m, updated_at: new Date().toISOString() })),
      { onConflict: 'company_id,agent_type,date' },
    );
  if (error) throw error;
  return metrics.length;
}
