## Goal
Re-enable the four medical verticals currently hidden by the HIPAA gate (home_health, physical_therapy, occupational_therapy, hospice) across the entire platform, and surface a clear note that HIPAA + BAA compliance is in progress with medical AI receptionist & scheduling coming soon.

## Changes

### 1. Unhide the medical industries
`src/lib/industryVisibility.ts` — empty the `HIPAA_GATED_INDUSTRIES` set so:
- `isIndustryVisible()` returns true for all industries
- `INDUSTRY_LIST` in `industryTemplates.ts` and `industryMarketingContent.ts` automatically include the 4 medical verticals
- Industry dropdown picker, marketing industry selector, signup, audit, demo seeder, and sitemap all show them again

No other code changes needed — the gate is centralized.

### 2. Add the "HIPAA/BAA coming soon" note
Add a new shared component `src/components/marketing/MedicalComplianceNotice.tsx`:
- Small Alert/Callout (shield icon, primary accent border)
- Copy: "Medical & healthcare verticals — We're actively completing HIPAA compliance and BAA agreements. Medical AI receptionists and patient scheduling will be available soon. Contact us to join the early-access list."
- "Contact us" links to `/contact`

Render it conditionally (only when the selected industry is one of the 4 medical IDs) on:
- `src/pages/ForBusiness.tsx` (industry marketing page) — under the industry hero
- `src/components/marketing/IndustryDropdownPicker.tsx` — a small inline hint under the trigger when a medical industry is picked (optional sibling render handled by parent)
- Signup industry-pick step (whichever component renders the industry picker during signup)

I'll confirm the exact signup file path while implementing; the notice component is reusable so it can drop in wherever the medical IDs appear.

### 3. Memory update
Update `mem://architecture/...` (the existing HIPAA-gated memory note) to reflect that medical verticals are now visible with a compliance-in-progress notice, rather than hidden.

## Out of scope
- No backend/RLS changes
- No new industry packs or operative changes
- Sitemap regen happens automatically on next build via existing script
