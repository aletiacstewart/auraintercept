
# Pipeline Enhancement for Lead Capture & Scoring

Adds pipeline/deal tracking as an internal capability of the existing `outreach` (Lead Capture & Scoring), `customer_journey`, and `business_finance` operatives. **No new operative. No "CRM" wording. Operative count stays at 10 / agent count stays at 24.**

## 1. Database

New migration: `customer_pipeline` table
- `id`, `company_id` (FK companies), `customer_profile_id` (FK, nullable), `lead_id` (FK, nullable)
- `stage text NOT NULL DEFAULT 'new'` — validated via trigger (not CHECK) against: `new, contacted, quoted, won, lost, repeat_customer`
- `stage_changed_at`, `deal_value_cents`, `next_action`, `next_action_due_at`, `last_activity_at`, `created_at`, `updated_at`
- GRANT SELECT/INSERT/UPDATE/DELETE to authenticated; GRANT ALL to service_role
- RLS: mirror `customer_profiles` — company-scoped via `get_user_company_id(auth.uid())`, plus platform_admin bypass
- Indexes: `(company_id, stage)`, `(company_id, next_action_due_at)`
- Reuse existing `update_updated_at_column()` trigger function

## 2. Event routing (no new operative)

In `supabase/functions/ai-orchestrator/index.ts`:
- Do **not** add a `crm` entry to `AGENT_TYPES`
- Add pipeline-upsert side effects into existing handlers for the relevant events, routed through the operative that already owns them:
  - `lead_qualified`, `lead_scored` → handled inside `outreach`
  - `quote_sent`, `quote_approved`, `payment_received` → handled inside `business_finance`
  - `job_complete`, `review_received`, `churn_risk_detected` → handled inside `customer_journey`
- Each handler upserts the matching `customer_pipeline` row: advances `stage` (quote_sent→quoted, payment_received/job_complete→won, churn_risk_detected→next_action="win-back"), stamps `last_activity_at = now()`

## 3. Shared tools in `ai-agent-chat`

Add three function-calling tools using the existing `handoff_to_specialist` registration pattern:
- `get_customer_history({ customer_profile_id | phone | email })` — rolls up pipeline stage, deal value, last activity + recent calls/quotes/jobs/payments/reviews
- `update_pipeline_stage({ customer_profile_id, new_stage, note? })` — validates `new_stage` against the same allowlist as the DB trigger
- `suggest_next_action({ customer_profile_id })` — returns stored `next_action`/`next_action_due_at`; else computes using the 90-day cutoff from `winback-scan/index.ts`

Scope tool availability to the three operatives that already own this data: `outreach`, `customer_journey`, `business_finance`.

## 4. Pipeline console page

Create `src/pages/ai-consoles/PipelineConsole.tsx` (not "CrmConsole"):
- Header title: **"Pipeline"** with subtitle "Lead & deal tracking for your Lead Capture & Scoring operatives"
- Model on `BusinessManagementConsole.tsx` (PageHeader, PageContainer, FeatureGate)
- `FeatureGate requiredConsole="business_management"` — same gating as business_finance
- Kanban: 6 columns (new/contacted/quoted/won/lost/repeat_customer), cards show customer name (join `customer_profiles`), deal value, last activity
- Drag-and-drop → direct Supabase `update` on `customer_pipeline` (matches convention used by other consoles)
- Top "Needs attention" panel: rows where `next_action_due_at < now()`, sorted soonest-first, with "mark done" button that clears `next_action`/`next_action_due_at`
- Add nav entry under Business Management group (not a top-level console), route `/dashboard/pipeline`, label **"Pipeline"**
- Register route alongside other `ai-consoles/*` pages in the router

## 5. Guardrails (what we explicitly do NOT change)

- No edits to pricing PDFs, marketing pages, `PlatformGuides.tsx`, `AIAgentGuide.tsx`, canonical-phrasing memory, drift-guard tests, agent registry, `AGENT_TYPES`, operative counts, or the "CRM/Warranty Removal" memory
- No user-visible use of the word "CRM" anywhere — copy uses "Pipeline" and "Lead Capture & Scoring"
- No new operative card in the Operatives Hub

## Technical notes

- Stage validation: trigger instead of CHECK constraint (project standard for enum-like text columns)
- Pipeline rows are upserted keyed on `(company_id, customer_profile_id)` when present, else `(company_id, lead_id)`
- `last_activity_at` updates are idempotent — safe to re-run on replayed events
- Tool responses stay compact (single JSON object) to preserve model token budget

## Testing plan

- Migration runs cleanly; linter passes
- Fire test events via `ai-orchestrator` → verify pipeline row transitions
- Manual Kanban drag → row updates in DB
- Confirm no banned strings (`CRM`, `11 operatives`, `25 agents`) introduced: `rg` sweep before finishing
