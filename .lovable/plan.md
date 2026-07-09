# Automation Gap Roadmap — Aura Intercept

Audit found **15 concrete gaps** where a manual click, missing cron, or unused agent capability is doing work that could run itself. Every proven edge function already exists — most gaps are just missing invocation triggers.

Already automated (skipped): appointment reminders, lead follow-ups, weekly/monthly/quarterly digests, trial reminders, social post publishing, blog batch, agent event processing, cost alerts.

---

## ⭐ Build These 5 First (High impact × S–M effort — invocation-only changes)

| # | Title | Change | Effort |
|---|---|---|---|
| 1 | **Post-call voice review request** | Have `elevenlabs-post-call` invoke `send-review-request` on positive-sentiment calls over threshold duration | S |
| 2 | **Review request on job completion** | DB trigger on `job_assignments` status→`completed` calls `send-review-request` via `pg_net` — removes reliance on tech tapping "Complete Job" in-app | S |
| 3 | **CRM sync cron** | Add `aura-crm-sync-leads` at `0 */4 * * *` invoking existing `crm-sync-leads` function (currently "Sync Now" button only) | S |
| 4 | **Weekly social content batch** | Add `aura-generate-social-batch` at `0 7 * * 1` invoking existing `generate-social-batch` (currently wizard-only) | S |
| 5 | **Missed-call retry loop** | Add `aura-missed-call-retry` at `*/10 * * * *` querying `missed_call_callbacks WHERE status='pending' AND attempt_count<3 AND next_attempt_at<=now()` | M |

---

## Full Roadmap (grouped by impact × effort)

### High impact, Small–Medium effort
6. **Auto-dispatch on new job** — `job_assignments` INSERT trigger where `technician_id IS NULL` runs `booking-actions` scoring. Respects existing `dispatch_mode: auto|manual|hybrid` agent config that is currently a no-op.
7. **Winback campaigns** — `winback_offers` table exists with zero invocation. Add cron OR trigger on stale-customer appointments to call `send-campaign`.
8. **agent_proposed_actions write path** — Approve/reject UI exists but nothing writes to the queue. Wire `ai-orchestrator` (already runs every 2min) to detect idle patterns: uncontacted lead >48h, appointment with no tech >2h, invoice unpaid >14d. (L effort but very high impact — unlocks the whole automation review UX.)

### Medium impact
9. **Inventory low-stock alert** — Trigger on `inventory_items` when `quantity_on_hand <= reorder_point` → staff notification / proposed action.
10. **Knowledge base auto-refresh** — Trigger on `services`/`faqs` INSERT/UPDATE → debounced `generate-knowledge-base` (only runs during onboarding today).
11. **Analytics operative auto-run** — `analytics_intelligence` (insights/performance/revenue/forecast) never fires automatically. Fold into weekly digest cron to produce `agent_proposed_actions` rows.
12. **Google Calendar inbound sync cron** — Existing trigger pushes outbound only. Add `*/30 * * * *` cron to pull remote changes, removing manual "Sync" clicks.
13. **Campaign series scheduling** — After `generate-campaign-series` writes rows, deferred `pg_net` call sends each at its `scheduled_at` (currently requires per-send manual click).
14. **Tenant integration health check** — Daily cron iterates `tenant_integrations WHERE status='active'`, marks broken OAuth as `error`, notifies staff (broken tokens are currently discovered only when a user tries to use them).
15. **Employee onboarding welcome** — Trigger on `profiles` INSERT where `role='employee'` sends welcome/onboarding link (mirrors existing `on_auth_user_created` pattern).

---

## Technical Details

**Cron pattern to follow:** Register jobs alongside the existing `aura-*` cron entries. The cron_shared_secret pattern is already in place; each new job uses `net.http_post` with the shared bearer.

**Trigger pattern to follow:** DB triggers should call `net.http_post` inside a `BEGIN...EXCEPTION WHEN OTHERS THEN RAISE WARNING` block (mirrors `sync_appointment_to_google_calendar` and `handle_company_signup_notify`) so a failing edge function never blocks the underlying DML.

**Cost & safety:** Items 1–5 are cheap and reversible — each adds one cron entry or one trigger, and the target function already handles retries/tier gating. Items 7, 8, 11 need a rate-limit guard (per-company cooldown column) before they can safely fire on every event.

**Out of scope:** Multi-location features (per project memory). Anything already covered by the confirmed cron list above.

---

## What I need from you
Pick a slice to implement:
- **A)** All 5 quick wins (recommended — one migration + one edge function edit)
- **B)** Just #1–#4 (pure cron/trigger, zero function code)
- **C)** #8 (agent_proposed_actions write path) — biggest UX unlock, biggest scope
- **D)** Different subset — tell me which numbers
