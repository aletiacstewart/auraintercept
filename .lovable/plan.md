## Goal
Add two new canonical industries — `veterinary` and `medical_practice` — that mirror the `home_health` console experience but **without** field dispatch or GPS routing (booking-cluster behavior). Both surface the existing HIPAA/BAA "coming soon" notice.

## Changes

### 1. Canonical IDs
`src/lib/industryIdAliases.ts` + `supabase/functions/_shared/industry-aliases.ts` (kept in sync):
- Add `veterinary` and `medical_practice` to `CANONICAL_INDUSTRY_IDS`.
- Add aliases: `vet`, `vets`, `animal_hospital` → `veterinary`; `medical_office`, `doctor`, `clinic`, `physician`, `private_practice` → `medical_practice`.

### 2. Visibility + compliance notice
`src/lib/industryVisibility.ts`:
- Add both IDs to `MEDICAL_COMPLIANCE_PENDING_INDUSTRIES` so `<MedicalComplianceNotice />` renders for them.
- Leave `HIPAA_GATED_INDUSTRIES` empty (visible platform-wide).

### 3. Booking-cluster capability gating (no dispatch / GPS)
`src/lib/industryCapabilities.ts`:
- `hasFieldTechnicians()` → add `veterinary`, `medical_practice` to NO_TECH set.
- `usesQuotes()` → add both to NO_QUOTES.
- `usesInventory()` → add both to NO_INVENTORY (no parts stock).
- Leave leads + appointments enabled (they take bookings + new patient inquiries).

This automatically:
- Hides "Assign Technician" field (per `assign-technician-visibility` memory)
- Routes Field Operations console to the appointment-board variant (not dispatch/GPS)
- Hides Smart Dispatch / Re-optimize Routes workflows

### 4. Marketing surfaces
`src/lib/industryMarketingContent.ts` + `src/lib/industryTemplates.ts`:
- Add cards/dropdown entries for both verticals in the Healthcare group (alongside the other 4 medical IDs).
- Emoji: 🐾 veterinary, 🩺 medical_practice. Short tagline + bullet list mirroring `home_health` tone but patient/pet-focused.

### 5. Industry template packs (DB)
New migration that inserts two rows into `industry_template_packs` cloned from `home_health`, with:
- `cluster = 'booking'` (instead of trades/repair)
- `operating_model = 'appointment_booking'`
- Terminology overrides: vet → "patient/pet owner", "appointment", "exam"; medical_practice → "patient", "appointment", "visit"
- `quote_template` / `invoice_template` adjusted (visit/exam line items, no parts)
- KPI + nav labels reuse healthcare wording

### 6. Industry pack supporting libs (one-line additions where they key off industry_id)
Touch only the maps that already list `home_health` so the new IDs inherit sensible defaults — no new content authoring required for v1:
- `industryEmptyStates.ts`, `industryQuickActions.ts`, `industryFastStartQuestions.ts`, `industryHelpContent.ts`, `industryNavLabels.ts`, `industryKpiLabels.ts`, `industryAnalyticsPresets.ts`, `industryPortalCopy.ts`, `industryVoiceGreetings.ts`, `industryAuraSuggestions.ts`, `industryRolePreview.ts`.
- Each entry reuses or lightly adapts the `home_health` block. Vet copy says "pets/patients"; medical practice says "patients".

### 7. Demo seeder + sitemap
- `src/pages/DemoAccountSeeder.tsx` / seeder script: add 3 demo accounts each (admin / employee / customer), password `aidemo*!`, per existing registry pattern. Tier: Boost (matches other healthcare demos).
- Sitemap regenerates automatically on next build via `scripts/generate-sitemap.ts`.

### 8. Memory updates
- Update `mem://architecture/industry-id-canonical-standard` — bump industry count to 20 and list both new IDs.
- Update `mem://features/forms/assign-technician-visibility` — add both IDs to the no-dispatch list.
- Update `mem://platform-operations/demo-account-registry` — bump count, add 6 new accounts (2 industries × 3 roles).

## Out of scope
- Real HIPAA/BAA paperwork — the existing `MedicalComplianceNotice` continues to flag "coming soon".
- New AI operatives or edge functions — both industries reuse the existing booking/receptionist agents.
- Custom industry icons beyond emoji.

## Technical notes
- `hasFieldTechnicians()` returning false is what flips Field Operations from dispatch/GPS to the appointment-board view (see `src/pages/FieldOperations.tsx`), so we get the "same console minus dispatch/GPS" behavior for free.
- All IDs flow through `toCanonicalIndustryId()` per the canonical-naming standard, so no drift.
- Booking-cluster classification also hides Smart Dispatch workflow buttons and the "Assign Technician" field automatically.
