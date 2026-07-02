## Goal

Full re-audit of the platform against the four uploaded docs (homepage content pack, corrected audit questions, onboarding workbook revisions, social posting spec). Sweep every surface — pages, consoles, PDFs, help/guides, tooltips, video scripts, edge-function shared strings — for drift. Add a regression test so forbidden strings can't return. Defer the Upload-Post build.

## Forbidden-string list (single source of truth for the sweep)

Any hit against these gets fixed:

- `Healthcare` / `Home Health` / `Physical Therapy` / `Occupational Therapy` / `Hospice` / `Veterinary` / `Medical Practice` as a selectable industry (component pickers, PDFs, help copy, seed data, tests).
- `Port my existing number` / `port my existing business number` (phone-setup answer options only — porting isn't offered).
- `Google Workspace` referenced as a paid vendor (must be "Google Account — free, OAuth" wherever it's in a vendor/pricing context; leave alone in unrelated prose).
- `onboarding@auraintercept` (must be `ai@auraintercept.ai`).
- `[VENDOR NAME]` placeholder from the Social Media card / Scheduler copy (leave as-is per your call — will add a visible "vendor TBD" comment near each so future me knows why).
- Old tier labels: `Marketing (Pro+)` in social/marketing driver text → `Social Media (Boost+)` or `Outreach & Sales (Pro+)` per doc #2; `Billing (Elite)` → `Billing (Pro)`.
- `bundled` / `overage` / `absorbed` in third-party fee context.
- `24 hour Demo` / `14 day trial` / `48hrs` timeline copy (should all be 60-day live trial).
- `minutes, not months` steps copy (should be "days, not months" — steps section is currently removed; catch any reintroduction).

## Surfaces to sweep

**Marketing pages**
- `src/pages/Index.tsx`, `ForBusiness.tsx`, `Auth.tsx`, `SignUp.tsx`, `SignIn.tsx`, `OpportunityAudit.tsx`, `AuditReport.tsx`, `KnowledgeBase.tsx`, `Blog.tsx`, `Calculators.tsx`
- All `src/components/marketing/**` (industry picker, hero, integrations panel, etc.)

**Onboarding & audit surfaces**
- `src/components/onboarding/CompanyOnboardingForm.tsx`
- `src/components/audit/**` (`types.ts`, `AgentOpportunityAudit.tsx`, review question wording matches doc #2 verbatim)
- `src/lib/auditIndustryQuestions.ts`

**PDF exporters** (visual QA each after edits by rendering with pdfmake/react-pdf)
- `src/components/documentation/CompanyOnboardingPDF.tsx`
- `src/components/documentation/IntegrationOnboardingPDF.tsx`
- `src/components/documentation/PlatformFAQPDF.tsx`
- Every other file in `src/components/documentation/` (checklists, ToS, video prompts, marketing pack, etc.)

**Help / guides / tooltips / scripts**
- `src/lib/howToUseContent.ts`, `industryHelpContent.ts`, `helpSystemPrompt.ts`, `featureTooltips.ts`, `receptionistScripts.ts`, `campaignTemplates.ts`, `industryVoiceGreetings.ts`, `industryRolePreview.ts`
- Locale JSON: `src/locales/{en,es}/*.json`
- Video prompt page: `src/pages/VideoPromptsPage.tsx`

**Edge-function shared strings**
- `supabase/functions/_shared/onboarding-workbook-sections.ts`
- Any function that emails workbooks, sends onboarding reminders, or references the vendor list.

**Registries / seed data**
- `src/lib/mainIndustryCategories.ts`, `businessTypeRegistry.ts`, `businessTypeProfileMap.ts`, `industryIdAliases.ts` — confirm 17 industries only (healthcare cluster removed).
- Any test fixture or demo seeder that still enumerates removed verticals.

## Regression test

Add `src/lib/__tests__/contentDriftGuard.test.ts`:
- Load key doc-generator modules + a rendered sample of the two big PDFs (as text via a text-only render helper).
- Assert none of the forbidden strings appear.
- Runs under `bunx vitest run` in CI so future edits can't silently reintroduce drift.

## Explicitly out of scope

- Building the Upload-Post / Ayrshare social posting module (deferred by your call). Social Media card copy stays with `[VENDOR NAME]` placeholder; will add an inline `TODO(social-vendor):` code comment next to each so it's easy to find when you're ready.

## Deliverable per surface

For every file changed: one focused patch + a note in the final summary listing what forbidden strings I found there. If a surface has zero hits, I'll say so explicitly rather than silently skipping it, so you can trust the audit was complete.

## Verification

- `bunx tsgo` clean.
- New `contentDriftGuard` vitest passes.
- Render `CompanyOnboardingPDF` and `IntegrationOnboardingPDF` to images, spot-check the pages that changed (industry list, vendor worksheet, appendix, sign-off).
- Grep sweep re-run at the end to confirm zero remaining hits on the forbidden-string list.
