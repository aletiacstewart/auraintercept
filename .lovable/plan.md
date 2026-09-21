# Agent coordination: verify + observability dashboard

The 4 coordination gaps are implemented, deployed, and already proven by live runs (booking 05:07, dispatch 05:09, a forced-failure span at booking 05:07:02, customer_journey 03:28). The observability *infrastructure* from the prior Phase 5 also exists: `tracing.ts` (spans → `ai_agent_logs`), `agent-metrics.ts` (daily rollups → `agent_performance_metrics`), `agent-alerts.ts` (4 rules + `raiseAlerts` → `platform_issues`), the `ai-agent-health` endpoint, and `AgentHealthPanel` + `AgentAnalyticsDashboard` in the Agents hub Performance tab.

So this plan does not rebuild any of that. It closes the four things that are genuinely still missing.

## Part 1 — Live end-to-end verification (documented evidence)

Run three scenarios against a real test company and record the evidence, then remove test rows.

1. **Booking → dispatch claim (Gaps 1 + 2 + 4).** Send a booking request that calls `create_appointment`. Confirm:
   - an `appointment.created` row in `ai_agent_events` with `target_agent='dispatch'` and `status` moving `pending → processed`;
   - a `tool_success` row in `ai_agent_logs` for `create_appointment`;
   - a follow-up dispatch session claims that event (its `context_id` referenced) and replies without re-asking for the appointment;
   - the dispatch system prompt contained the readable "INFORMATION ALREADY COLLECTED" block, not raw JSON.
2. **Forced tool failure (Gap 3).** Force one tool call to throw. Confirm:
   - a `tool_failed` row in `ai_agent_logs` with `duration_ms` and `error_message`;
   - a `tool.failed` event row in `ai_agent_events` (admin subscribes);
   - the agent still returns a 200 with a partial reply acknowledging the failure;
   - remaining tools in the same turn still ran.
3. **Job complete → multi-agent fanout (Gaps 1 + 2).** `mark_job_complete` → `job.completed` event → both `customer_journey` and `business_finance` sessions pick up their copies on next start and act.

Evidence is captured as row snapshots (ids + status + timestamps). Test appointments/customers/logs created for these runs are deleted afterwards.

## Part 2 — Agent Observability tab (the real missing UI)

Add a single **Observability** tab to `src/pages/AIAgentsHub.tsx` (next to Discover / My Agents / Performance) with three panels. All data already exists in the database; this is read-only surfacing.

### 2a. Traces viewer (new component)
`src/components/agents/AgentTraces.tsx`. Groups `ai_agent_logs` rows by `trace_id` for the current company, newest first, and renders each trace as a waterfall:
- one bar per span (`request`, `span`, `ai_chat`, tool spans) scaled to the trace's total duration, colored by `status` (ok / error);
- parent/child via `parent_span_id` → `span_id`;
- click a trace → a detail drawer listing each span's `span_name`, `duration_ms`, `status`, and the `agent_type` + `action`.
- Filters: agent type, status (ok/error), last 1h / 24h / 7d.
- A trace = all `ai_agent_logs` rows sharing a `trace_id`; the top-level `request` span is the root.

### 2b. Event-flow feed (wire existing component)
`src/components/ai/agents/AgentEventLog.tsx` already exists but is not rendered anywhere in the hub. Wire it into the Observability tab (scoped to the current company) so you can see events being announced (`pending`), claimed (`processing`), and resolved (`processed`/`failed`) in near-real-time. Add a lightweight auto-refresh (10s) and a status filter.

### 2c. Open alerts panel (new component)
`src/components/agents/AgentAlerts.tsx`. Lists open `platform_issues` rows where `issue_type='ai_agent_error'` for the company, with severity, the rule that fired, the agent, first-seen, and **Acknowledge** / **Resolve** actions (status `acknowledged` → `resolved`). This complements the inline alerts already shown in `AgentHealthPanel` (which stays in Performance) with a full, actionable list.

## Part 3 — Verify alert rules actually fire

The four rules in `agent-alerts.ts` (error_rate > 5%, tool p95 > 1s, model p95 > 10s, agent silent 24h) have never fired — there are zero `ai_agent_error` rows in `platform_issues`. Confirm the path works end-to-end:

- Run Part 1 scenario 2 (forced failure) repeatedly to push the test company's error rate above 5% with ≥ `MIN_SAMPLE` (10) calls, then trigger one orchestrator `process_pending_events` cycle.
- Confirm a `platform_issues` row is created (deduped — no duplicate), a staff notification row exists, and it appears in the new AgentAlerts panel and in `AgentHealthPanel`.
- Acknowledge + resolve it from the UI and confirm the row updates.
- Verify the `agent_silent` rule fires for an enabled agent with no logs in 24h.

No threshold changes ship to production — verification uses the test company only.

## Technical notes

- No schema migration. All tables and columns already exist (`ai_agent_logs.trace_id/span_id/parent_span_id/span_name/status`, `ai_agent_events`, `agent_performance_metrics`, `platform_issues`).
- No new edge functions. The orchestrator already runs `rollUpAgentMetrics → evaluateAlerts → raiseAlerts`.
- Frontend-only for Part 2: three components + one tab in `AIAgentsHub.tsx`, using the existing `supabase` client and the same hook patterns as `useAgentHealthMetrics`.
- Part 1 and Part 3 are test runs against a real test company; records are cleaned up.
- The 24 stale Feb-10 `failed` event rows (legacy `booking_handoff`/`triage_handoff`, attempt_count 0) are left as-is — they predate this work and are harmless dust.

## Verification (live)

1. Part 1: the three scenarios produce the documented row snapshots and the partial-reply-on-failure behavior.
2. Part 2: the Observability tab shows real traces (waterfall), a live event feed, and an actionable alerts list.
3. Part 3: a forced error-rate condition produces a `platform_issues` row that surfaces in both alert panels and resolves from the UI.

## Not included

Load testing (needs real traffic over a week), a separate metrics dashboard product, rewriting remaining handoff-pair prompts, and changing alert thresholds in production.
