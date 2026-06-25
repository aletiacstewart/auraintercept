
# Agentic Automation Deep Audit & Upgrade Plan

## What I found (current state)

**Strong foundations already in place:**
- 11 cron jobs running (reminders, follow-ups, digests, social publisher, blog batcher, cost alerts, unsubscribe alerts, health probe) surfaced in `AutonomyStatusPanel`
- 10 consolidated operatives wired across 7 consoles, tier-gated cleanly
- `ai-agent-chat` (8,476 lines) does real tool-calling with `tool_choice: 'auto'`
- `ai-orchestrator` exists for multi-agent handoffs
- Health probe (`cron-health-check`) writes to `platform_issues` so we see autonomy gaps

**Gaps that block "more agentic":**
1. **No per-company autonomy settings.** Every action that mutates data goes through the same approval path. There's no "auto-send replies under $X", "auto-book if calendar clear", "auto-post social if confidence > 0.8" toggle.
2. **No agent action queue with confidence + auto-execute threshold.** Agents propose; humans click. There's no `agent_proposed_actions` table with `confidence_score`, `risk_tier`, `auto_executed_at`.
3. **Orchestrator handoffs are reactive, not proactive.** Agents respond to events but rarely chain ("new lead → enrich → score → book → notify → follow-up in 3d") without a human clicking through.
4. **Platform-ops manual work that should be automated for us:**
   - Manual demo reseeding, manual onboarding invite triage, manual subscription tier verification, manual Stripe reconciliation, manual platform_issues triage, manual industry-pack QA when new business types are added.
5. **Employee/technician side:** dispatcher still drags jobs; agents could auto-assign by skill + proximity + load with a "review next 5 assignments" approval batch.
6. **Customer side:** booking widget is reactive; no proactive "you're due for service" outreach loop tied to last_service_date.
7. **Console bloat:** 13 console pages + AI Operatives Hub; some pages (BusinessInsightsPage, CustomerInsightsPage, DemandForecastPage, KpiDashboardPage, PerformanceReportPage, RevenueAnalysisPage) overlap heavily with AnalyticsConsole and could collapse into tabs.

---

## Plan — three workstreams

### Workstream 1: Per-company autonomy framework (foundation for everything else)

Build the missing control plane so every agent can be safe-auto, approval-first, or off — per agent, per company.

**New table `company_agent_autonomy`** (RLS, GRANT, company-scoped):
- `company_id`, `agent_id`, `mode` (`off` | `suggest` | `auto_safe` | `auto_all`), `confidence_threshold` (0–1), `max_value_usd` (cap on auto-execute dollar impact), `daily_action_cap`, `quiet_hours`, `updated_by`

**New table `agent_proposed_actions`** (the action queue):
- `id`, `company_id`, `agent_id`, `action_type`, `payload`, `risk_tier` (`low|medium|high`), `confidence`, `status` (`pending|auto_executed|approved|rejected|expired`), `executed_at`, `result_summary`, `requested_by_event`

**New page `/dashboard/automation`** (company admin):
- Per-agent autonomy sliders with plain-English explainers
- Live "auto-executed in last 24h" feed with one-click rollback where reversible
- Daily/weekly "things Aura did for you" digest (already partly in monthly-digest function)

**Edge function `agent-action-executor`:** the only path agents use to take a mutating action. It reads `company_agent_autonomy`, decides auto vs queue, writes to `agent_proposed_actions`, executes or waits.

### Workstream 2: Make agents agentic (proactive chains, not reactive replies)

**Upgrade `ai-orchestrator` to run event-driven chains:**
- New `agent_workflow_chains` config (per industry pack) defining triggers → steps → handoffs
- Example chains: `new_lead → enrich (web search) → score → propose booking → if accepted, schedule + send confirm + add to follow-up cron`
- `missed_call → SMS apology in 60s → offer booking link → if no reply 24h, queue voice callback`
- `quote_sent → 48h no response, auto-nudge → 5d, escalate to admin`
- `job_completed → auto review request → if 5★, auto-ask for referral → if <4★, alert admin`
- `low_inventory → auto-reorder draft → admin approves in one tap`

**Add `stopWhen: stepCountIs(50)` and proper multi-step loops** in `ai-agent-chat` so agents actually finish a task (currently single-shot tool calls).

**Add proactive cron triggers** (new pg_cron jobs):
- `aura-stale-lead-revival` (daily) — leads with no activity 14d → outreach agent drafts re-engagement
- `aura-due-for-service` (daily) — customers with `last_service_date` past industry-pack cadence → customer_journey agent schedules outreach
- `aura-pipeline-mover` (every 6h) — stuck deals → admin/outreach agent acts
- `aura-content-calendar-filler` (weekly) — if social queue < 7 days, creative_content auto-drafts

### Workstream 3: Platform-ops automation (for us)

So we stop being the bottleneck.

- **Auto-onboarding bot:** signup → industry pack auto-applied → `initialize-company-agents` already runs → NEW: auto-create Stripe customer, auto-send welcome email with concierge calendar link, auto-open `platform_issues` ticket only if a step fails
- **Auto demo refresh:** weekly cron reseeds expired demo accounts (currently manual at `/dashboard/demo-seeder`)
- **Auto subscription reconciliation:** daily cron compares Stripe → `companies.subscription_tier`, flags drift in `platform_issues`
- **Auto industry-pack QA:** when a new business type is added, run a smoke check (does the pack resolve? do empty states render? do operatives initialize?) and write to `platform_issues`
- **Auto cost-guard escalation:** existing `cost-alerts` only emails — add auto-throttle (pause non-essential agents when company hits 90% of monthly cap)

---

## Console / dashboard / feature changes to reconsider

**Collapse (reduce surface area, not features):**
- Merge `BusinessInsightsPage`, `CustomerInsightsPage`, `DemandForecastPage`, `KpiDashboardPage`, `PerformanceReportPage`, `RevenueAnalysisPage` into `AnalyticsConsole` as tabs. They're already tier-gated together and share data sources.
- `NewLeadPage` → fold into `MarketingSalesConsole` as a side panel; standalone page is a redundant click.

**Add:**
- `/dashboard/automation` (Workstream 1)
- "What Aura did for you today" hero strip on `Dashboard.tsx` (replaces some static KPI tiles in Simple mode)
- Action queue inbox bell (next to staff-notification bell) for pending agent proposals
- Per-agent "trust score" badge on AI Operatives Hub (auto-execute success rate, last 30d)

**Remove/deprecate:**
- Static "no data yet" empty states that don't link to an agent action — already partly done, finish the sweep
- Manual "Run agent" buttons where a cron + autonomy setting would do it (keep them as overrides, hide by default in Simple view)

**Keep but harden:**
- All 10 operatives stay. The 24-agent legacy mapping stays for grandfathered data.
- Approval-first remains the default for `auto_all`-equivalent destructive actions (billing, contracts, mass outreach > N recipients).

---

## Technical details

- All new tables: RLS enabled, `GRANT SELECT/INSERT/UPDATE/DELETE` to `authenticated`, `GRANT ALL` to `service_role`, policies scoped via `company_id = get_user_company_id(auth.uid())` and `has_role()` for admin-only mutations
- `agent_proposed_actions` indexed on `(company_id, status, created_at desc)` for inbox queries
- `agent-action-executor` is `verify_jwt = false`, validates JWT in code, uses Zod on payload
- New cron jobs registered via `supabase--insert` (per `schedule-jobs-supabase-edge-functions` guidance) — not in migrations, since URL + anon key are tenant-specific
- Orchestrator chains stored as JSON in `industry_template_packs.workflow_chains` so they ride the pack system
- Autonomy mode `auto_safe` definition: confidence ≥ threshold AND risk_tier = low AND value ≤ max_value_usd AND outside quiet_hours AND under daily_action_cap
- Rollback support: every auto-executed action writes a `reverse_payload` so the inbox "Undo" button is real, not cosmetic
- Trust score = rolling 30d ratio of (auto_executed not rejected within 24h) / (auto_executed total)

---

## Suggested build order

1. Autonomy tables + `/dashboard/automation` page + executor edge function (Workstream 1 — unblocks everything)
2. Orchestrator chain config + 4 highest-value chains (new lead, missed call, quote nudge, post-job review)
3. Platform-ops autopilot (onboarding, demo refresh, subscription reconciliation)
4. Console consolidation (Analytics tabs, lead page fold-in, dashboard "what Aura did" strip)
5. Per-agent trust scores + cron expansion (stale lead, due-for-service, pipeline mover, calendar filler)

Each step ships independently and is reversible via the autonomy toggle.
