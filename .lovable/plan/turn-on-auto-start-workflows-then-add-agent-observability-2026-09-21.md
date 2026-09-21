# Turn on auto-start workflows, then add agent observability

## Part 1: Turn the workflow switch on

Flip the `workflow_orchestrator` flag to on globally so a new booking automatically starts the five-step New Service Request run (intake, booking, dispatch, routing, customer message). Customer-facing messages still land in the Approval Queue first, and failing runs still escalate with Try again / Cancel.

## Part 2: Observability (Phase 5)

Today each agent reply writes one row to the activity log with no timing, no error rows, and no link between a request and the handoffs it triggered. The performance table exists but has never been filled (0 rows). This phase makes every agent request measurable end to end.

### What you get

- A Performance view that shows, per agent: requests, average and slowest response time, error rate, and handoff count for the last 24 hours / 7 / 30 days.
- A warning banner when an agent crosses the alert thresholds, plus an entry in the Issues list so it is not missed.
- A health endpoint that reports, per agent, whether it is enabled, configured and responding.

### Technical work

**1. Request tracing (`supabase/functions/_shared/tracing.ts`)**

`RequestTracer` creates a trace per inbound request and nested spans per unit of work:

```text
trace: ai-agent-chat request
 ├─ span: agent.triage        (model call)
 ├─ span: handoff.booking
 │   ├─ span: agent.booking   (model call)
 │   └─ span: tool.book_appointment  (db write)
 └─ span: event.emit appointment.created
```

API: `startTrace({companyId, agentType, channel})`, `tracer.span(name, attrs)` returning `{end(ok|error, attrs)}`, `tracer.finish()`. Spans buffer in memory and flush in one batched insert so tracing never blocks the response; flush failures are swallowed and logged. Trace/span ids propagate through handoffs and through the workflow engine via the existing `AgentContext` (`metadata.traceId`), so a whole workflow run shares one trace.

**2. Storage** — migration extends `ai_agent_logs` with `trace_id uuid`, `span_id uuid`, `parent_span_id uuid`, `span_name text`, `status text`, and fills the existing unused `duration_ms` / `error_message` columns. Index on `(company_id, created_at desc)` and on `trace_id`. Existing rows are untouched (nullable columns).

**3. Metrics collector** — `supabase/functions/_shared/agent-metrics.ts` rolls spans up into the existing `agent_performance_metrics` table (one row per company / agent / day: `requests_handled`, `avg_response_time_ms`, `success_rate`, `handoff_count`, plus new `p95_response_time_ms` and `error_count`). Rollup runs from the existing every-2-minute worker for the current day (upsert) — no new cron job.

**4. Health endpoint** — rewrite `supabase/functions/ai-agent-health/index.ts` to accept an optional `company_id` and return: database reachability and latency, per-agent status from the registry (`enabled`, `configured`, `last_seen`, `error_rate_24h`, `avg_latency_ms`), connected-provider presence, and an overall `healthy | degraded | unhealthy`. Keeps the current response keys so `AIAgentTestSuite` and `cron-health-check` keep working.

**5. Alert rules** — `supabase/functions/_shared/agent-alerts.ts` evaluates after each rollup, over a 1-hour window with a minimum of 10 requests so one bad call cannot page anyone:

| Rule | Threshold |
| --- | --- |
| Error rate | > 5% |
| Tool/database span latency | p95 > 1000 ms |
| Model-call latency | p95 > 10 s (AI inference is seconds, not milliseconds) |
| No successful request | agent enabled but silent 24 h |

A firing rule inserts into `platform_issues` (`issue_type = 'ai_agent_error'`, severity by rule) and notifies company admins via `staff_notifications`. Re-firing is deduped against an open issue for the same agent + rule.

**6. Instrumented example: the booking agent** — `ai-agent-chat` starts a trace on entry, wraps the model call, each tool call (`check_availability`, `book_appointment`), and the handoff emission in spans, and records tool failures as error spans instead of the current always-`success: true` log write. This is the pattern all other agents then follow (same helper, no per-agent code).

**7. UI** — Performance tab of the Agents hub gains a per-agent metrics table (requests, avg, p95, error rate, handoffs) with a 24h/7d/30d selector and an alerts strip at the top. Platform admins additionally get a trace drill-down: pick a request, see its spans with timings and which step failed. New components kept under 300 lines each.

### Out of scope

External tracing vendors (OTLP export), sampling controls, per-user dashboards, changing agent prompts or tools.
