/**
 * Alert rules over traced agent spans.
 *
 * Evaluated after each metrics rollup on a one-hour window. A firing rule
 * raises a `platform_issues` row and notifies company admins, deduped against
 * an issue that is already open for the same agent + rule.
 */

import { percentile } from './agent-metrics.ts';

export type AlertRuleId = 'error_rate' | 'tool_latency' | 'model_latency' | 'agent_silent';

export interface AlertRule {
  id: AlertRuleId;
  label: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  threshold: number;
}

/** Thresholds are deliberately different for tool work vs model inference. */
export const ALERT_RULES: Record<AlertRuleId, AlertRule> = {
  error_rate: { id: 'error_rate', label: 'Error rate above 5%', severity: 'high', threshold: 5 },
  tool_latency: { id: 'tool_latency', label: 'Tool calls slower than 1s (p95)', severity: 'medium', threshold: 1000 },
  model_latency: { id: 'model_latency', label: 'AI replies slower than 10s (p95)', severity: 'medium', threshold: 10000 },
  agent_silent: { id: 'agent_silent', label: 'Agent enabled but silent for 24h', severity: 'low', threshold: 24 },
};

/** Below this many requests in the window, one bad call must not page anyone. */
export const MIN_SAMPLE = 10;

export interface FiredAlert {
  company_id: string;
  agent_type: string;
  rule: AlertRuleId;
  value: number;
  detail: string;
}

export async function evaluateAlerts(
  supabase: any,
  opts: { companyId?: string | null; windowMinutes?: number } = {},
): Promise<FiredAlert[]> {
  const windowMinutes = opts.windowMinutes ?? 60;
  const since = new Date(Date.now() - windowMinutes * 60_000).toISOString();

  let query = supabase
    .from('ai_agent_logs')
    .select('company_id, agent_type, span_name, action, duration_ms, success')
    .gte('created_at', since)
    .limit(10000);
  if (opts.companyId) query = query.eq('company_id', opts.companyId);

  const { data, error } = await query;
  if (error) throw error;

  type Bucket = { requests: number; errors: number; model: number[]; tool: number[] };
  const buckets = new Map<string, Bucket>();

  for (const row of data || []) {
    if (!row.company_id || !row.agent_type) continue;
    const key = `${row.company_id}|${row.agent_type}`;
    const b = buckets.get(key) ?? { requests: 0, errors: 0, model: [], tool: [] };
    const name = String(row.span_name || '');
    if (row.action === 'request') {
      b.requests += 1;
      if (row.success === false) b.errors += 1;
    } else if (name.startsWith('agent.model') && typeof row.duration_ms === 'number') {
      b.model.push(row.duration_ms);
    } else if (name.startsWith('tool.') && typeof row.duration_ms === 'number') {
      b.tool.push(row.duration_ms);
    }
    buckets.set(key, b);
  }

  const fired: FiredAlert[] = [];
  for (const [key, b] of buckets) {
    const [company_id, agent_type] = key.split('|');
    if (b.requests < MIN_SAMPLE) continue;

    const errorRate = (b.errors / b.requests) * 100;
    if (errorRate > ALERT_RULES.error_rate.threshold) {
      fired.push({
        company_id,
        agent_type,
        rule: 'error_rate',
        value: Number(errorRate.toFixed(1)),
        detail: `${b.errors} of ${b.requests} requests failed in the last ${windowMinutes} minutes (${errorRate.toFixed(1)}%).`,
      });
    }

    const toolP95 = percentile(b.tool, 95);
    if (b.tool.length >= MIN_SAMPLE && toolP95 > ALERT_RULES.tool_latency.threshold) {
      fired.push({
        company_id,
        agent_type,
        rule: 'tool_latency',
        value: toolP95,
        detail: `Slowest tool calls are taking ${Math.round(toolP95)}ms (target under 1000ms).`,
      });
    }

    const modelP95 = percentile(b.model, 95);
    if (b.model.length >= MIN_SAMPLE && modelP95 > ALERT_RULES.model_latency.threshold) {
      fired.push({
        company_id,
        agent_type,
        rule: 'model_latency',
        value: modelP95,
        detail: `Slowest AI replies are taking ${(modelP95 / 1000).toFixed(1)}s (target under 10s).`,
      });
    }
  }

  return fired;
}

/** Raise issues + notifications for newly firing alerts. Returns rows created. */
export async function raiseAlerts(supabase: any, alerts: FiredAlert[]): Promise<number> {
  let created = 0;

  for (const alert of alerts) {
    const rule = ALERT_RULES[alert.rule];
    const title = `${alert.agent_type}: ${rule.label}`;

    const { data: existing } = await supabase
      .from('platform_issues')
      .select('id')
      .eq('company_id', alert.company_id)
      .eq('issue_type', 'ai_agent_error')
      .eq('title', title)
      .in('status', ['new', 'acknowledged', 'in_progress'])
      .limit(1);

    if (existing?.length) continue;

    const { error: issueError } = await supabase.from('platform_issues').insert({
      company_id: alert.company_id,
      issue_type: 'ai_agent_error',
      severity: rule.severity,
      status: 'new',
      title,
      description: alert.detail,
      metadata: { rule: alert.rule, agent_type: alert.agent_type, value: alert.value },
    });
    if (issueError) {
      console.error('[Alerts] Failed to raise issue:', issueError.message);
      continue;
    }

    await supabase.from('staff_notifications').insert({
      company_id: alert.company_id,
      recipient_role: 'company_admin',
      notification_type: 'agent_health',
      title,
      message: alert.detail,
      metadata: { rule: alert.rule, agent_type: alert.agent_type, value: alert.value },
    });

    created += 1;
  }

  return created;
}
