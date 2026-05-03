# Add Healthcare Verticals Across Platform Surfaces

The 6 healthcare verticals (Dental, Chiropractic, Medical Office, Veterinary, Physical Therapy, Optometry) currently exist in `industry_blueprints`, `agentStyles`, and `CustomIndustryWizard`, but they're missing from every other surface that renders the industry catalog. This plan threads them through signup, landing pages, marketing PDFs, guides, and content packs.

## Scope

Add the 6 healthcare IDs (`dental`, `chiropractic`, `medical_office`, `veterinary`, `physical_therapy`, `optometry`) and one new "Healthcare & Wellness" group across:

### 1. Canonical registry
- `src/lib/industryIdAliases.ts` — add the 6 IDs to `CANONICAL_INDUSTRY_IDS`; add aliases (`dentist→dental`, `chiro→chiropractic`, `medical→medical_office`, `vet→veterinary`, `pt→physical_therapy`, `optom→optometry`).

### 2. Signup & onboarding
- `src/components/onboarding/BusinessTypeSelector.tsx` — add 6 `BusinessTemplate` entries with healthcare-appropriate icons (Stethoscope, Activity, HeartPulse, PawPrint, Dumbbell, Eye), services, hours, and a new `cluster: 'healthcare'`. Add Healthcare label to `CLUSTER_LABELS`.
- `src/pages/Auth.tsx` — already reads from `INDUSTRY_LIST`; will pick up new entries automatically. Verify dropdown and HIPAA hint text appears when a healthcare ID is chosen.

### 3. Marketing content registry
- `src/lib/industryMarketingContent.ts` — add 6 `IndustryContent` entries with hero copy, pain points, sample calls (appointment-focused, no clinical), sample services (Cleanings, Adjustments, Annual Exams, Wellness Visits, Therapy Sessions, Eye Exams), sample appointment + lead, colors. Add new group entry to `INDUSTRY_GROUPS`: `{ group: 'Healthcare & Wellness', emoji: '🩺', ids: [...6 ids] }`.

### 4. Landing page
- `src/pages/Index.tsx` — add a 7th `industryCategories` entry "Healthcare & Wellness" with the 6 verticals (icons + short descriptions). Auto-renders in the industry grid.

### 5. Industry templates (social/SMS)
- `src/lib/industryTemplates.ts` — add 6 `IndustryTemplate` entries with appointment-reminder, recall, and review-request copy. Strict no-clinical-advice guardrails baked into copy ("schedule your check-up", never "your symptoms suggest…").

### 6. Field ops + analytics presets
- `src/lib/industryFieldOpsWorkflows.ts` — add appointment-centric workflows (Recall sweep, Insurance verification, No-show recovery, Day-end wrap).
- `src/lib/industryAnalyticsPresets.ts` — add KPI presets (Recall completion %, No-show rate, Insurance verification rate, Avg lead time to appointment).

### 7. Documentation & PDFs
- `src/lib/documentationConfig.ts` — bump `PLATFORM_STATS.industries` to include the 6 healthcare verticals; update the "18 industry packs" wording to "24 industry packs" (also in `PlatformDocumentPDF.tsx` line 1225).
- `src/components/documentation/IndustryMarketingKitPDF.tsx` — add 6 industry sections following the existing badge + content-template pattern. Each section includes hero copy, sample calls, social templates, and a HIPAA-aware disclaimer footer ("Aura is not a clinician; appointments + insurance only").
- `src/components/documentation/PlatformFAQPDF.tsx` — auto-picks up new industries via `PLATFORM_STATS.industries`. Add one Q/A about healthcare scope (appointments + insurance verification only; no PHI/EHR/medications).
- `src/components/documentation/SocialMediaContentPackPDF.tsx`, `WebsiteCopyPDF.tsx`, `SalesPitchDataPDF.tsx` — add a "Healthcare verticals" section/callout listing the 6 supported types and the explicit out-of-scope items.

### 8. Help & guides
- `src/lib/helpContentConfig.ts`, `src/lib/howToUseContent.ts` — add a "Healthcare setup" entry covering HIPAA acknowledgement, insurance verification flow, vet pets-as-JSON, and the Healthcare Integrations Console at `/dashboard/integrations/healthcare`.
- `src/pages/PlatformGuides.tsx` — add a Healthcare guide card linking to the integrations console and the HIPAA scope notes.

### 9. Pricing comparison
- `src/components/landing/PricingComparisonTable.tsx` — note that healthcare verticals are available on **all 4 tiers** (Core/Boost/Pro/Elite) with the same HIPAA guardrails.

### 10. Empty states & industry packs
- `src/lib/industry*` files referenced by `IndustryEmptyState` — confirm healthcare empty-state copy exists (it was added in the previous Healthcare Vertical Pack work). Add any missing surfaces (leads/quotes/customers).

## Out of scope (explicit guardrails reinforced everywhere)

All new copy and PDFs explicitly state Aura Intercept does **not** handle:
- Medical records / EHR / PMS sync
- Medications, prescriptions, refills
- Clinical advice, triage, or diagnosis
- Pharmacy or lab integrations
- HIPAA-covered PHI beyond appointments + insurance carrier/member ID

## Technical Notes

- All new healthcare entries use the existing `appointment_booking` blueprint model.
- Veterinary uses the already-shipped `customers.pets` JSONB + `appointments.pet_id`.
- The `trg_auto_set_healthcare_compliance` trigger already flips `companies.healthcare_compliance = true` for these IDs, so no DB migration is needed.
- HIPAA acknowledgement modal in `CustomIndustryWizard` already exists and triggers on these IDs.
- Memory file `mem://features/industry/healthcare-vertical-pack` already documents the scope; no memory updates needed unless new constraints emerge.

## Files Touched (estimate ~15)

Registries (3) + onboarding (2) + landing (1) + content libs (4) + PDFs (5) + help/guides (2) + pricing (1).

No new routes, no schema changes, no edge functions.
