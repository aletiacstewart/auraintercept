# Platform Consistency Remediation Plan

Two parallel deep audits surfaced ~100 findings. Below is the prioritized fix plan, grouped so it can ship in 4 phased PRs. Lower-confidence auditor claims will be verified before edits (noted as "verify first").

---

## Phase 1 — Pricing, Trial & 3rd-Party Copy (highest customer-trust impact)

### 1A. Wrong/stale prices
- **`src/components/documentation/CompanyOnboardingPDF.tsx` L1403–1406** — tier cards show onboarding fee as the monthly price (Core "$249/mo" etc.). Rewrite to `Core $497/mo · $249 one-time onboarding` and same for Boost/Pro/Elite, sourced from `launchPricing.ts`.
- **`src/components/documentation/MarketingSalesMasterPDF.tsx` L509** — "starting at $249/mo" → "starting at $497/mo".
- **`src/components/subscription/ThirdPartyCostDisclosureDialog.tsx` L105–107, L206** — replace hardcoded original onboarding fees ($349/$549/$999/$1,749) with `getOnboardingPrice(tier)` from `launchPricing.ts`; render `~~original~~ launch` with "Launch Pricing" chip.
- **`src/components/integrations/CostCalculator.tsx` L582, L571, L580, L301** — rename customer-facing "Twilio" → "SignalWire"; rename internal `twilioCost` → `signalwireCost`; update voice rate to SignalWire's published range.
- **`src/pages/SignUp.tsx` L871** — annual savings claim "Save ~20%" → "Save ~17%" (10× monthly math).

### 1B. Trial wording (60-Day Live Trial)
- **`.lovable/memory/marketing/pricing/canonical-four-tier-model.md`** — rewrite to match `trial-period-standard.md` (60-day, 30+30) and fix Elite to $3,497/$3,097.
- **`src/components/documentation/MarketingSalesMasterPDF.tsx` L517, L552, L622–624** — remove every "remaining 60 days / run live for 60" phrasing; trial is 30d onboarding + 30d live.
- **`src/components/documentation/SalesPitchDataPDF.tsx` L853** — strip the "two weeks money-back" line; replace with non-refundable-onboarding wording.

### 1C. Forbidden 3rd-party language & disclosure gaps
- **`src/components/integrations/CostCalculator.tsx` L60, L159–160** — rename `overagePer1000` → `extraPer1000`; rename `freeEmails` → `resendFreeTierLimit`; reframe comments as "billed by Resend directly".
- **`src/components/documentation/WebsiteCopyPDF.tsx` L586** — "no per-call charges" → "no per-call charges from Aura; SignalWire bills your account at their rates".
- **`src/components/documentation/PlatformDocumentPDF.tsx`** — append 3rd-party-costs caveat to ROI net figure.
- **`src/components/onboarding/CompanyOnboardingForm.tsx` L860**, **`GoLiveTimeline.tsx` L89–90**, **`AgentHowToGuide.tsx` L109, L155** — replace remaining "Twilio" references with "SignalWire" and add "your own account, billed directly" disclosure.
- **Customer-facing strings**: `SMSChat.tsx` L126, `TestCallDialog.tsx` L145–146, `ReminderSettings.tsx` L160 & L345 — replace "Twilio" with "SignalWire".

### 1D. Launch Pricing chip / strikethrough
- **`SalesPitchDataPDF.tsx` tier cards** and **`MarketingSalesMasterPDF.tsx` L639** — render `was $X → $Y/mo (Launch Pricing)` using `LAUNCH_PRICING`/`SUBSCRIPTION_TIERS`.
- **`PricingSummaryPDF.tsx` L112–115** — rename misleading `connect`/`performance` aliases to `core`/`boost`/`pro`/`elite`.

---

## Phase 2 — Medical Compliance Notice Surfacing

- **`src/components/marketing/MedicalComplianceNotice.tsx`** — verify export name and that imports use `MedicalComplianceNotice` (audit flagged an `n` alias; **verify first** — likely a search artifact).
- Render `<MedicalComplianceNotice industryId={pack?.industry_id} />` at the top of every dashboard surface for industries in `MEDICAL_COMPLIANCE_PENDING_INDUSTRIES` (home_health, physical_therapy, occupational_therapy, hospice, veterinary, medical_practice):
  - `Dashboard.tsx` / `CompanyAdminDashboard.tsx`
  - `ai-consoles/CustomerPortalConsole.tsx`
  - `ai-consoles/MarketingSalesConsole.tsx`
  - `ai-consoles/FieldOpsConsole.tsx`
  - `ai-consoles/BusinessManagementConsole.tsx`
  - Technician dashboard layout

---

## Phase 3 — Industry Pack Parity (esp. veterinary & medical_practice)

### 3A. Wire vet/medical into every per-industry lib (currently fall back to defaults)
Add entries for `veterinary` and `medical_practice` (mirror `home_health` with pet/patient language) in:
- `src/lib/industryVoiceGreetings.ts`
- `src/lib/industryFastStartQuestions.ts` (also add `home_health`, `physical_therapy`, `occupational_therapy`, `hospice`)
- `src/lib/industryAuraFraming.ts`
- `src/lib/industryEmptyStates.ts`
- `src/lib/industryQuickActions.ts`
- `src/lib/industryMarketingPlaybooks.ts`
- `src/lib/industryWorkflows.ts`
- `src/lib/industryAgentMap.ts` `INDUSTRY_OVERRIDES`
- `src/lib/industryAnalyticsPresets.ts`
- `src/lib/industryKpiLabels.ts` — add `Jobs: 'Exams'` (vet) / `Jobs: 'Visits'` (medical)
- `src/lib/industryTemplates.ts` — add missing `fitness`, `mobile_mechanic`, `salon`, `professional`

### 3B. Schema & canonical-ID alignment (verify first)
- **`src/lib/industryPackSchema.ts` cluster enum** — auditor says it's `['trades','outdoor','repair','booking']` and rejects `home_health`. Verify; if true, add `'home_health'` (or rename to `'healthcare'`) and ensure DB packs validate.
- **`src/lib/industryIdAliases.ts CANONICAL_INDUSTRY_IDS`** — verify missing `fitness`, `mobile_mechanic`, `salon`, `professional`, `saas_platform`; add any truly absent.

---

## Phase 4 — Console / Sidebar / Operative Cleanup

### 4A. Console gating
- **`src/pages/DispatchFieldOpsApp.tsx`** — gate by `hasFieldTechnicians(pack)` / `console_visibility.field_ops`; redirect non-field industries to booking flow.
- **`src/pages/ai-consoles/SpecialistOperativesConsole.tsx`** — filter the static 14-item `SPECIALISTS_RAW` against `pack.extra_operatives`; show empty state otherwise.
- **`src/lib/subscriptionAgentConfig.ts` L40–43** — remove `field_operations` from `starter.consoles` (no dispatch agents in that tier).
- **`DashboardLayout.tsx` L147** vs config — reconcile `analytics_reports` tier (sidebar says `command`, config says `starter`).

### 4B. Sidebar industry-aware labels
- **`DashboardLayout.tsx` L119, L121, L135, L138–139, L167** — drive labels from `navLabels`/`serviceConfig`: `My Jobs` → `My ${jobNounPlural}`, `Job History`, `Field Ops` group header, `Technician View`/`Dispatch View`, `Install App`.
- **L148** — hide "Specialist Operatives" sidebar link when `pack.extra_operatives` is empty.
- **`TechnicianDashboardLayout.tsx` L71, L153, L291** — replace hardcoded "Technician" / "Install Field Ops App" with `navLabels.teamMemberNoun` / `serviceConfig.installAppLabel`.

### 4C. Operative model cleanup
- **`src/lib/agentStyles.ts` L15–51** — normalize legacy IDs through `normalizeAgentName` before label lookup OR remove the legacy entries (decide: remove preferred).
- **`src/pages/AIAgentsHub.tsx` L122–126, L278** — add `admin` to displayed operatives at performance+; replace legacy `['inventory','campaign']` with canonical `['business_finance','outreach']`.
- **`src/lib/subscriptionAgentConfig.ts` L47/L67/L92 descriptions** — change "8/12/16 Smart AI Agents" → operative counts (5/7/10).
- **`AGENT_DEPENDENCIES` / `CONSOLE_REQUIRED_AGENTS`** — add `admin` operative entries.
- **`supabase/functions/initialize-company-agents/index.ts`** — stop seeding legacy 24-agent IDs alongside canonical operatives for new companies (existing data left alone for now to avoid scope creep).

### 4D. Handoff routing safety
- **`src/lib/auraRunBus.ts`** and **`supabase/functions/ai-orchestrator/index.ts`** — apply `normalizeAgentName()` / `LEGACY_AGENT_MAP` at event entry so legacy IDs (`booking`, `route`, `lead`, etc.) reach the canonical handler.

---

## Out of scope / explicitly skipped
- Auditor claimed the 8 standard memory files are missing — they are present in `mem://index.md`; treating that finding as a false positive.
- No DB migrations to delete legacy `company_agents` rows in this pass (separate cleanup task).
- No new specialist operatives invented for vet/medical (`vaccine_reminder`, etc.) — only wire what already exists.

## Verification before edits
- Re-read each cited file before patching (audits may have stale line numbers).
- Spot-check `MedicalComplianceNotice` export and `industryPackSchema` cluster enum (auditor confidence was lower).
- After Phase 1 PDFs, re-render at least one PDF and visually confirm.

## Approximate scope
- ~30 files touched across Phase 1, ~6 across Phase 2, ~12 across Phase 3, ~10 across Phase 4.
- No new dependencies, no schema migrations required (Phase 3B may add one enum value).
