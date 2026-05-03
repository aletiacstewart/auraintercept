# Industry-Adaptive Workspace Refactor

Goal: Make Aura Intercept truly multi-tenant and industry-adaptive. Industry choice (at signup) automatically configures dashboards, consoles, AI agents, KPIs, workflows, and prompts — no manual toggling. Plan tier controls capacity (how many industries, how much automation), not which industry features are available.

## 1. Database Schema

Add to `companies` (or `business_profiles`):
- `industry_type` (text) — primary industry slug (e.g. `hvac`, `real_estate`, `saas`, `restaurant`, `wellness`, `legal`, `other`)
- `secondary_industries` (text[]) — additional industries (gated by plan capacity)
- `operating_model` (text) — derived: `field_dispatch`, `appointment_booking`, `pipeline_sales`, `receptionist_only`, `custom`
- `industry_config` (jsonb) — per-tenant overrides (KPIs, prompts, custom fields, workflows)
- `supported_modules` (jsonb) — resolved list of active consoles/agents/widgets

New table `industry_blueprints` (seeded, editable by platform_admin):
- `slug`, `name`, `operating_model`, `primary_records` (jsonb), `default_agents` (jsonb), `default_consoles` (jsonb), `default_kpis` (jsonb), `prompt_overrides` (jsonb), `restrictions` (jsonb — e.g. restaurants = receptionist_only)

## 2. Workspace Resolver

Single source of truth: `src/lib/workspace/resolveCompanyWorkspace.ts`

```typescript
resolveCompanyWorkspace(company) -> {
  operatingModel,
  primaryRecords,        // e.g. ['service_calls','equipment'] vs ['demos','trials']
  activeConsoles,        // which console components to render
  activeAgents,          // which of the 24 agents are auto-enabled
  agentActions,          // industry-specific tools per agent
  kpis,                  // dashboard metrics
  promptOverrides,       // injected into AI agent prompts
  restrictions           // hard limits (e.g. no booking for restaurants)
}
```

Logic: `blueprint(industry) ∩ planCapacity(tier) ∪ industry_config overrides`

Replaces all current manual `ai_agent_configs.enabled` toggling. A sync function writes resolved agent set to `ai_agent_configs` automatically on industry/plan change.

## 3. Plan = Capacity, Not Features

| Tier  | Industries | Agent depth | Automation runs |
|-------|------------|-------------|-----------------|
| Core  | 1          | Core 10     | Limited         |
| Boost | 2          | Core + 4 adv| Standard        |
| Pro   | 3          | Most agents | High            |
| Elite | Unlimited  | All 24      | Unlimited       |

Industries are NOT locked to specific tiers. Any industry works on any tier.

## 4. Adaptive Operations Console

Refactor `/dashboard/dispatch-field-ops` → `/dashboard/operations` with router:

```text
operatingModel === 'field_dispatch'      -> <FieldDispatchConsole/>   (HVAC, plumbing, electrical, locksmith, towing, cleaning, landscaping, pest)
operatingModel === 'appointment_booking' -> <AppointmentConsole/>     (wellness, salon, dental, medical, fitness, legal-consults)
operatingModel === 'pipeline_sales'      -> <PipelineConsole/>        (saas, real_estate, insurance, auto-sales)
operatingModel === 'receptionist_only'   -> <ReceptionistConsole/>    (restaurants — AI receptionist + smart links only)
operatingModel === 'custom'              -> <CustomConsole/>          (Other industry, user-defined workflow)
```

Each console renders genuinely different UI: different primary records, different actions, different layouts — not just renamed labels.

Examples:
- FieldDispatch: live truck map, dispatch board, route optimization, equipment history
- Appointment: chair/room calendar, recurring bookings, deposit collection, no-show recovery
- Pipeline: deal stages, demo scheduler, trial-rescue queue, MRR tracker
- Receptionist: call log, smart-link manager, FAQ trainer (no booking UI)

## 5. Adaptive Dashboard & Sidebar

`CompanyAdminDashboard` reads workspace KPIs from resolver and renders the matching widget set. Sidebar filters items where `requiredOperatingModel` doesn't match. Agent labels (Front Desk / On The Way / etc.) get an industry layer (e.g. "On The Way" → "Agent En Route" for real estate showings).

## 6. Industry-Specific Agent Behavior

`customer_journey` operative gains industry actions:
- HVAC: `book_service_call`, `dispatch_emergency`, `quote_repair`
- Real estate: `schedule_showing`, `send_listing`, `request_preapproval`
- SaaS: `book_demo`, `start_trial`, `escalate_churn_risk`
- Restaurant: `send_smart_link`, `take_message` (no booking)

Agent prompts get `promptOverrides` injected from blueprint — terminology, scripts, escalation rules adapt automatically.

## 7. Signup / Onboarding

- Industry dropdown at signup (18 verticals + "Other / Custom")
- "Other" → wizard collects: primary thing scheduled/sold, customer type, key actions, then drafts an `industry_config`
- Free Audit asks vertical-specific questions
- After signup, resolver runs and provisions the workspace automatically

## 8. Restaurants — Hardcoded Restriction

Restaurant blueprint sets `restrictions: { booking: false, integrations: ['receptionist','smart_links'] }`. Booking UI hidden, agents instructed to direct customers to website/booking link, no dispatch console.

## 9. Demo Account Migration

Update the 54 demo accounts (18 industries × admin/employee/customer) to set `industry_type` and let resolver provision them. Reseeder at `/dashboard/demo-seeder` updated. Per-vertical empty-state copy already exists — wire it through workspace.

## 10. Files Touched (high level)

- Migration: add columns + `industry_blueprints` table + seed 18 blueprints
- `src/lib/workspace/resolveCompanyWorkspace.ts` (new)
- `src/hooks/useWorkspace.ts` (new) — replaces scattered useIndustryPack/useTier checks
- `src/pages/dashboard/Operations.tsx` (new router) + 5 console components
- `src/components/dashboard/CompanyAdminDashboard.tsx` — KPI driven by resolver
- `src/components/Sidebar*.tsx` — filter by operatingModel
- `src/lib/agents/` — inject promptOverrides + industry actions
- Edge functions: `sync-company-workspace` (runs on industry/plan change), update agent-normalization
- Onboarding: `IndustryStep.tsx`, `CustomIndustryWizard.tsx`
- Demo seeder updates

## 11. What This Is NOT

- Not just renaming labels (Job Queue → Schedule). Consoles render structurally different components.
- Not manual toggles. Admins can override but defaults come from resolver.
- Not industry-locked tiers. Industry shapes workspace; tier sets capacity.
- Not adding restaurant reservations (explicit exclusion).

## Approval

Reply "approve" or "build it" to begin. I'll start with the migration + resolver + Operations router, then migrate one console (HVAC field_dispatch) end-to-end as a reference pattern before doing the rest.

---

## Update — Continued (next pass)

- ✅ Wired `loadCompanyWorkspace` + `buildIndustryPromptSnippet` into `voice-handler` so the SignalWire SWML system prompt now picks up industry terminology, scripts, and `restrictions.booking === false` (e.g. restaurants are explicitly told NOT to book and to send a Smart Link).
- ✅ Sidebar `Operations` entry now reads `useWorkspace().operatingModel` and adapts:
  - `field_dispatch` → "Dispatch View" (HVAC etc.)
  - `appointment_booking` → "Appointment Console"
  - `pipeline_sales` → "Pipeline Console"
  - `receptionist_only` → entry is hidden (restaurants), with rendering falling back to `<ReceptionistConsole/>` if a deep link is hit.
  - `custom` → "Operations"
- ✅ `restrictions.dispatch === false` now also hides the field-ops entries, regardless of legacy `console_visibility` settings.

### Still TODO (next pass)
1. Inject workspace prompt into `aura-unified` (text intent classifier) so chat replies follow industry restrictions too.
2. Replace placeholder cards in `AppointmentConsole`, `PipelineConsole`, `ReceptionistConsole` with real queries (calls today, smart-link clicks, deals by stage).
3. Add "Industry" step to onboarding + "Other / Custom" wizard that writes `industry_config`.
4. Update `CompanyAdminDashboard` KPI grid to read from `workspace.kpis` instead of hardcoded list.

- ✅ Replaced placeholder "—" cards in `AppointmentConsole`, `PipelineConsole`, and `ReceptionistConsole` with live Supabase counts (appointments today/week/no-shows; lead stage counts + conversion %; calls today + smart-link inventory). Each console now shows real, company-scoped data and remains structurally distinct from the field dispatch view.
