---
name: Industry ID canonical standard
description: Canonical industry IDs for companies.industry_vertical and how to normalize at every write boundary
type: feature
---
The single source of truth for industry IDs is `industry_template_packs.industry_id`.

## Canonical IDs (24)
hvac, plumbing, electrical, roofing, solar, landscape, pool_spa, pest_control,
appliance_repair, handyman, construction, auto_care, security_systems,
real_estate, beauty_wellness, restaurants, personal_assistant, fencing,
home_health, physical_therapy, occupational_therapy, hospice,
veterinary, medical_practice.

Healthcare verticals (home_health, physical_therapy, occupational_therapy,
hospice, veterinary, medical_practice) surface the HIPAA/BAA "coming soon"
notice via `<MedicalComplianceNotice />`. `veterinary` and `medical_practice`
share `home_health` cluster + console layout but are listed in NO_TECH /
NO_INVENTORY / NO_QUOTES (industryCapabilities.ts) so dispatch + GPS UI are
hidden — patients/pets come to the clinic.

## Rule
Every write to `companies.industry_vertical` MUST go through
`toCanonicalIndustryId()` from `src/lib/industryIdAliases.ts`
(or `supabase/functions/_shared/industry-aliases.ts` in edge functions).
Never persist a drifting legacy value (`realestate`, `solar_energy`,
`landscaping`, etc.) — `useIndustryPack()` will silently fall back to the
generic pack and every dashboard/console/AI agent will miss its industry
configuration.

## Write boundaries (already wired)
- `src/pages/Auth.tsx` — company-admin signup INSERT
- `src/components/onboarding/FastStartWizard.tsx` — already canonical (BUSINESS_TEMPLATES)
- `supabase/functions/create-demo-trial` — normalizes inbound `industry` param

## Data sources kept canonical
- `src/lib/industryTemplates.ts` (Auth dropdown)
- `src/lib/industryMarketingContent.ts` (`/for-business` cards + Start Demo)
- `INDUSTRY_DEFAULTS` in `create-demo-trial`
