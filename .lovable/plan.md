# Remove Healthcare Verticals

Strip the 6 healthcare industry packs and all related code, prompts, integrations, demo accounts, and docs. Leave every other vertical (trades, outdoor, repair, salon, restaurant, real estate, fitness, beauty, professional, SaaS, personal assistant) untouched.

## Healthcare verticals being removed

`medical_office`, `dental`, `veterinary`, `chiropractic`, `optometry`, `physical_therapy`

## Database changes (migration)

1. `DELETE FROM industry_template_packs WHERE industry_id IN (...6 ids)`
2. Reset 6 demo companies' `industry_vertical` so they don't render healthcare UI:
   - Easier path: delete the 6 demo companies + their child rows entirely (cascades to user_roles, leads, jobs, etc.) so the seeder no longer surfaces them.
   - Companies: Demo Chiropractic, Dental, Medical Office, Optometry, Physical Therapy, Veterinary Clinic.
3. Delete the matching `auth.users` rows for `*admin@demo.com`, `*employee@demo.com`, `*customer@demo.com` for those 6 verticals (via `auth.admin.deleteUser` from a one-shot edge function — AI cannot directly write `auth.users`).

## Code deletions

- `src/lib/integrations/healthcare/registry.ts` — delete file + folder
- `src/pages/HealthcareIntegrationsConsole.tsx` — delete file
- Remove route + nav entry in `src/App.tsx` and any sidebar referencing healthcare integrations console

## Code edits (strip healthcare branches)

For each file below, remove only the healthcare-specific cases / IDs / HIPAA logic; keep the rest:

- `src/hooks/useMultiAgentChat.ts` — drop HIPAA guardrail injection
- `src/lib/industryAgentMap.ts` — remove healthcare console configs (Care Team, Reception Agent overrides, providerNoun, pet/patient terminology)
- `src/lib/industryIdAliases.ts` — remove healthcare aliases
- `src/lib/industryHelpPrompts.ts`, `industryHelpContent.ts`, `industryRolePreview.ts`, `industryCapabilities.ts`, `industryFastStartQuestions.ts`, `industryVoiceGreetings.ts`, `industryAnalyticsPresets.ts`, `industryTemplates.ts`, `industryMarketingPlaybooks.ts`, `industryMarketingContent.ts`, `agentStyles.ts`, `documentationConfig.ts` — remove healthcare entries
- `src/components/onboarding/BusinessTypeSelector.tsx` + `CustomIndustryWizard.tsx` — remove healthcare options
- `src/components/knowledge/AIContentProfileManager.tsx`, `tutorial/TutorialStep.tsx`, `documentation/IndustryMarketingKitPDF.tsx`, `PlatformDocumentPDF.tsx`, `PlatformFAQPDF.tsx`, `integrations/RecommendedPlanCalculator.tsx` — strip healthcare cases
- `src/pages/Index.tsx`, `src/pages/PlatformGuides.tsx`, `src/pages/TermsOfService.tsx`, `src/pages/PrivacyPolicy.tsx` — remove healthcare marketing copy + HIPAA mentions
- `supabase/functions/seed-demo-accounts-v2/index.ts` — remove the 6 healthcare seed entries
- `supabase/functions/_shared/industry-pack.ts` — remove healthcare branches

## Memory cleanup

Delete:
- `mem://features/industry/healthcare-vertical-pack`
- `mem://features/integrations/healthcare-integrations-scope`

Update `mem://index.md` to remove those two lines and update Demo Account Registry note (54 → 36 accounts; 18 → 12 industries).

## Validation

- Grep `rg -i "healthcare|hipaa|medical_office|veterinar|chiropract|optometry|physical_therapy|dental"` across `src/` + `supabase/functions/` and confirm only intentional matches remain (e.g. landing-page "no medical records" disclaimers if user wants — otherwise also removed).
- Run `psql` confirm 6 packs gone, 6 demo companies gone.
- Smoke-test: log in as `hvacadmin@demo.com` (trades) and `salonadmin@demo.com` (booking) — both consoles still render correctly.

## Out of scope

- No changes to trades, outdoor, repair, salon, restaurant, real estate, fitness, beauty, professional, SaaS, personal assistant verticals.
- The recent industry-aware console refactor stays in place — it correctly serves the remaining non-trades verticals (salon, restaurant, real estate, etc.).

Reply **go** to execute.
