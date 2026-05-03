## Polish & Coverage Sweep — Items 1 → 8

Executes the eight follow-ups to the industry-awareness rollout in the recommended order. Items 1, 3, 6 are mostly verification/data; items 2, 4, 5, 7, 8 add new code.

---

### 1. QA pass — terminology audit (verification only)

Programmatic ripgrep sweep across customer-facing surfaces (`src/components/customer`, `src/components/portal`, `src/components/booking`, `src/pages/CustomerPortal*`, `src/pages/PublicBooking*`) for hardcoded `Job`, `Technician`, `Customer` strings. Already spot-checked clean — confirm with a final pass and document findings in plan.md.

### 2. Surface Fast Start answers in Knowledge Base

- Extend `src/lib/industryFastStartQuestions.ts` with `parseFastStartAnswers()` and `upsertFastStartBlock()` helpers (regex-based round-trip on the prompt block).
- New component `src/components/knowledge/BusinessContextManager.tsx` — loads the company's `ai_agent_prompt`, parses the Fast Start block, renders the same questions as editable inputs, and saves back via `upsertFastStartBlock` (preserves admin's free-form prompt above the block).
- Add a new "Business Context" tab (icon: Sparkles) to `src/pages/KnowledgeBase.tsx`, placed after AI Profile.

### 3. Backfill new KB seed docs into existing companies

Run `seed_industry_pack_kb_for_company` for every company with an `industry_vertical` set. Function is idempotent (skips existing doc names). Done via psql/migration tool.

### 4. Pack coverage report (admin-only)

- New page `src/pages/admin/PackCoverage.tsx` (gated to platform_admin, route `/dashboard/pack-coverage`).
- Reads all 28 rows of `industry_template_packs` plus `src/lib/industryMarketingPlaybooks.ts` and presents a table with checkmark columns: terminology, kpi_labels, quick_actions, kb_seed_documents (count), agent_prompt_deltas (count), marketing_playbooks (count), service_catalog (count). Highlights any pack below the parity bar (3 KB docs, 2 playbooks, 6 quick actions, full terminology set).
- Add nav entry in the platform_admin sidebar group.

### 5. Marketing playbooks parity for thin packs

Extend `src/lib/industryMarketingPlaybooks.ts` so salon, fitness, professional, and the 6 healthcare verticals each have 2-3 starter campaigns matching the trades depth (subject + body + cadence + audience filter). No schema changes — file is static.

### 6. Operative prompt-injection audit

Ripgrep across `supabase/functions/*/index.ts` for the operative system-prompt construction sites and verify each one calls the `industry-pack` injection helper. Patch any that don't (likely candidates: newer marketing/content edge functions). Already-touched ones include `ai-agent`, `ai-agent-chat`, `voice-handler`, `sms-handler`, `widget-api`.

### 7. Industry-aware Aura voice greeting

- New helper `getIndustryVoiceGreeting(pack)` in `src/lib/industryVoiceGreetings.ts` returning a vertical-tailored greeting (e.g. salon: "Thanks for calling {company}, this is Aura — would you like to book or check on an appointment?").
- Wire into `FastStartWizard.handleLaunch` so when `companies.ai_voice_greeting` is still the default, we replace it on launch.
- Also expose a "Reset to industry default" button in `src/components/ai/AIAgentSettings.tsx` (already manages this field).

### 8. Onboarding completion analytics

- New table `onboarding_step_events` (company_id, step, action: 'view'|'complete'|'skip', created_at) with RLS: insert by anyone with `auth.uid()`, select restricted to platform_admin + own company.
- Instrument `FastStartWizard` step transitions to fire inserts (no-op on failure).
- New admin tile on `/dashboard/pack-coverage` (or the existing analytics suite) showing step-by-step funnel and skip rates across the last 30 days.

---

### Technical notes

- Items 3 and 8 are the only DB-touching ones (3 = data refresh via existing function, 8 = new table + RLS migration).
- Items 5 and 6 are pure code; no schema. Item 7 adds one tiny lib file plus two small wirings.
- All new UI uses theme CSS variables only (Cyber-Sentry standard).
- Item 4's coverage page lives under platform_admin gating per `/dashboard/architecture` precedent.
- The pack-coverage table doesn't require a backend RPC — `industry_template_packs` is already readable by authenticated users and we filter client-side; counts are cheap.

### Files touched (expected)

New:
- `src/components/knowledge/BusinessContextManager.tsx`
- `src/pages/admin/PackCoverage.tsx`
- `src/lib/industryVoiceGreetings.ts`
- `supabase/migrations/<timestamp>_onboarding_step_events.sql`

Edited:
- `src/lib/industryFastStartQuestions.ts` (add parser/upsert)
- `src/lib/industryMarketingPlaybooks.ts` (9 thin packs)
- `src/pages/KnowledgeBase.tsx` (new tab)
- `src/components/onboarding/FastStartWizard.tsx` (voice greeting + analytics events)
- `src/components/ai/AIAgentSettings.tsx` (reset-to-default button)
- `src/App.tsx` + sidebar config (route + nav for /dashboard/pack-coverage)
- 1-3 edge functions identified by item 6's audit
- `.lovable/plan.md` (mark all 8 done)

Reply **go** to execute 1 → 8 in sequence.

## Polish 1-8 — DONE (2026-05-03)
1. QA: no hardcoded Job/Technician/Customer in customer-facing surfaces ✓
2. Business Context tab in Knowledge Base + parser/upsert helpers ✓
3. Backfilled industry KB seeds for 25 existing companies ✓
4. /dashboard/pack-coverage admin page (terminology/KB/services/deltas) ✓
5. Marketing playbooks for salon, fitness, professional, saas, dental, medical_office, chiropractic, physical_therapy, optometry, veterinary ✓
6. Operative prompt-injection audit: all edge fns already wired (no patches needed) ✓
7. Industry voice greeting on Fast Start launch + reset button in AI Agent Settings ✓
8. onboarding_step_events table + step view/launch telemetry in FastStartWizard ✓
