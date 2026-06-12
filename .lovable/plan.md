## Goal
Verify that **every** plan (Core / Boost / Pro / Elite) requires an industry at signup, and that once selected, the dashboard, consoles, agents, terminology, KPIs, forms and empty states adapt to that industry **regardless of tier**.

## What I found so far

**Signup (`src/pages/SignUp.tsx`)**
- Industry is enforced for every tier: `canonicalIndustry` is validated via `toCanonicalIndustryId` + `isCanonicalIndustryId`; missing/invalid → toast + abort (line 254–263). Good.
- Tier is independent (`starter | connect | performance | command`) — industry gate runs before company insert for all four.
- "Other / Custom" path stores `industry_config` JSON; canonical check still passes because `other` is canonical.
- `initialize-company-agents` is invoked post-insert so the operatives hub reflects tier × industry.

**Industry → UI plumbing (already wired)**
- `useIndustryPack(companyId)` → resolves the per-vertical pack (widgets, terminology, console_visibility, form_schemas, quote/invoice templates, agent_prompt_deltas, extra_operatives).
- `resolveCompanyWorkspace` → operating_model + activeConsoles + KPIs + agentActions per company.
- Edge prompt injection: `_shared/industry-pack.ts` and `_shared/workspace.ts` decorate voice/SMS/chat prompts.
- Capability gates: `hasFieldTechnicians`, `usesQuotes`, `usesLeads`, `usesInventory`, `usesAppointments`, `usesCompaniesB2B`.
- Surfaces already industry-aware (per memory + grep): CompanyAdminDashboard, EmployeeDashboard, AuraCommandCenter, IndustryWidgetGrid, FieldOperations, Quotes, Invoices, Leads, Customers, Inventory, Messages, CallHistory, AIAgentsHub, SpecialistOperativesConsole, AppointmentConsole, SocialMediaConsole, CustomerPortalConsole, BusinessManagementConsole, AnalyticsConsole.

## Audit checklist I will run

1. **Signup gate parity** — confirm every entry path enforces industry:
   - `/signup` (SignUp.tsx) ✓ already gated
   - `/auth` (Auth.tsx) — verify; if it can create a company, it must require industry too
   - `OnboardingForm.tsx`, `FastStartWizard.tsx`, `WelcomeModal.tsx`, `admin/OnboardingInvites.tsx` — verify any path that writes `companies` requires `industry_vertical`
   - Beta-code / invite signups — same gate
2. **Tier independence** — confirm `useIndustryPack` and `resolveCompanyWorkspace` are not short-circuited by tier anywhere (grep for `subscription_tier` near pack/console gating). Specialists already confirmed available on all tiers (`specialists-all-plans.md`).
3. **Console adaptation coverage** — for each top-level console route, confirm it reads `useIndustryPack` (or capability helpers) and not hardcoded labels: FieldOps, BusinessMgmt, Analytics, MarketingSales, SocialMedia, CustomerPortal, AIAgentsHub, Operations router (Appointment/Pipeline/Receptionist/Custom).
4. **Terminology** — spot-check that forms (Quotes/Invoices/Leads/Customers/Inventory) pre-fill from `pack.terminology` and `pack.quote_template` / `invoice_template`.
5. **Edge runtime** — confirm voice/SMS edge functions call `loadIndustryPackForCompany` + `applyIndustryPackToPrompt` (already standardized per memory).
6. **DB trigger** — confirm `trg_seed_industry_pack_kb` fires on `industry_vertical` set so KB seeds at signup.

## Fixes I'll apply if gaps surface

- Add `industry_vertical` required validation to any signup/onboarding path missing it (toast + abort, identical UX to SignUp.tsx).
- Wrap any console still using hardcoded labels with `useIndustryPack` / capability helpers.
- Patch any tier-gated `useIndustryPack` usage so the pack always loads (tier only affects operative count, never industry adaptation).
- Add a single regression test asserting: company created on each of the 4 tiers + each cluster returns the correct `activeConsoles` + `terminology` from `resolveCompanyWorkspace`.

## Deliverable

- Short audit report posted in chat (per-surface ✓ / ✗).
- Code patches for any ✗ items above.
- One new vitest covering tier×industry → workspace resolution.

## Out of scope

- New industries, new tiers, pricing changes, marketing copy.
