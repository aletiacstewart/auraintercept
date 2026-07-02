## Goal

Make every customer-facing surface (pages, consoles, PDFs, export docs, guides, help content, tooltips, edge-function strings, locale JSON) consistent with the three canonical sources:

1. **Homepage content pack** — hero, pricing, 60-day trial, 3rd-party pass-through policy
2. **Onboarding workbook (2026.1 revision)** — 17 industries (healthcare hidden), Google Account (free OAuth), no phone porting, ai@auraintercept.ai
3. **Audit document (corrected)** — question wording, tier labels, industry list

## Canonical values (single source of truth)

| Field | Correct value |
|---|---|
| Pricing tiers | Core $497 / Boost $994 / Pro $1,988 / Elite $3,979 (Beta, monthly) |
| Standard (strikethrough) | Core $697 / Boost $1,394 / Pro $2,788 / Elite $5,576 |
| Onboarding fee (Beta) | Core $249 / Boost $497 / Pro $994 / Elite $1,990 (50% off, 1x, due at trial start) |
| Trial | 60-Day Live Trial (30d concierge onboarding + 30d full live use) |
| Industries | 17 (healthcare cluster HIDDEN via HIPAA gate) |
| Phone setup | Forward only. NO porting. |
| Google | "Google Account — free, OAuth" (never "Google Workspace" as paid vendor) |
| Aura outbound email | `ai@auraintercept.ai` |
| 3rd-party billing | Customer's own account + own card, invoiced separately. Never "bundled/overage/absorbed" |
| Tier labels | "Social Media (Boost+)", "Outreach & Sales (Pro+)", "Billing (Pro)" — NOT "Marketing (Pro+)" / "Billing (Elite)" |
| Timelines | "days, not months" — NOT "minutes, not months" / "24 hour" / "14 day" / "48hrs" |
| Social vendor | Placeholder `[VENDOR NAME]` with `TODO(social-vendor):` code comment (deferred build) |

## Surfaces to sweep

**PDF exporters** (`src/components/documentation/**`, `src/components/audit/**`)
- CompanyOnboardingPDF, IntegrationOnboardingPDF, PlatformFAQPDF, AuditChecklistPDF, ToS, checklists, video prompts, marketing pack, outreach toolkit PDFs
- Every remaining file in `documentation/` — verify pricing table, trial length, 3rd-party clause, industry list, Google copy, tier labels

**Export/print pages**
- `src/pages/ExportDocumentation.tsx`, `PublicOnboardingIntake.tsx`, `IntegrationDocs.tsx`, `KnowledgeBase.tsx`, `VideoPromptsPage.tsx`

**Marketing pages & components**
- `Index.tsx`, `ForBusiness.tsx`, `Auth.tsx`, `SignUp.tsx`, `SignIn.tsx`, `OpportunityAudit.tsx`, `AuditReport.tsx`, `Blog.tsx`, `Calculators.tsx`, `Referrals.tsx`
- `src/components/marketing/**` — pricing, hero, integrations panel, industry pickers, ROI/DIY calculators

**Onboarding & audit surfaces**
- `CompanyOnboardingForm.tsx`, `src/components/audit/**`, `auditIndustryQuestions.ts`, `industryFastStartQuestions.ts`

**Help / guides / tooltips / scripts**
- `howToUseContent.ts`, `industryHelpContent.ts`, `helpSystemPrompt.ts`, `featureTooltips.ts`, `receptionistScripts.ts`, `campaignTemplates.ts`, `industryVoiceGreetings.ts`, `industryRolePreview.ts`, `documentationConfig.ts`, `diyCostBreakdown.ts`
- Locale JSON: `src/locales/{en,es}/*.json`

**Edge-function shared strings**
- `supabase/functions/_shared/onboarding-workbook-sections.ts` (and any function that emails workbooks, sends onboarding reminders, references vendor list, or renders pricing)

**Registries / seed data**
- `mainIndustryCategories.ts`, `businessTypeRegistry.ts`, `businessTypeProfileMap.ts`, `industryIdAliases.ts`, `launchPricing.ts`, `subscriptionAgentConfig.ts` — confirm 17 industries, canonical pricing
- Demo seeder tier map

## Method

For each surface, grep for the forbidden strings + verify canonical values are present and correctly worded. One focused patch per file. If a file is clean, note it explicitly in the final summary.

## Regression test

Add `src/lib/__tests__/contentDriftGuard.test.ts`:
- Renders `CompanyOnboardingPDF`, `IntegrationOnboardingPDF`, `PlatformFAQPDF`, `AuditChecklistPDF` to text
- Imports help/guide/tooltip/receptionist/campaign modules
- Loads locale JSON
- Asserts none of the forbidden strings appear AND canonical pricing values are present in pricing surfaces
- Runs under `bunx vitest run`

## Explicitly out of scope

- Building the social posting module (deferred). `[VENDOR NAME]` stays with a `TODO(social-vendor):` code comment.
- Any backend schema, business logic, or feature work — copy/consistency only.

## Verification

- `bunx tsgo` clean
- `contentDriftGuard` vitest passes
- Render both big PDFs to images, spot-check pricing table, industry list, Google/vendor pages, trial length, sign-off
- Final grep sweep for every forbidden string — expect zero hits
- Final summary lists every file touched + files audited-and-clean

## Deliverable

A single sweep pass. Final summary organized by surface with per-file notes so the audit is auditable.
