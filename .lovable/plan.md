## Goal
Hide every medical/healthcare industry from all customer-facing surfaces (marketing, signup, demo seeder, audit, PDFs, sitemap, templates, industry pickers). Keep the underlying packs/DB rows so we can re-enable with a single flag flip later.

## Affected industries
`home_health`, `physical_therapy`, `occupational_therapy`, `hospice`, `veterinary`, `medical_practice`

## Changes

1. **`src/lib/industryVisibility.ts`** — populate `HIPAA_GATED_INDUSTRIES` with the 6 medical IDs above. This is already wired into every surface that calls `isIndustryVisible` / `filterVisibleIndustries` / `filterVisibleIds` (marketing pages, signup dropdown, demo seeder UI, audit, PDF generators).

2. **`supabase/functions/_shared/industry-aliases.ts`** — extend `HIPAA_GATED_INDUSTRIES` with `veterinary` and `medical_practice` so edge functions (e.g. `create-demo-trial`) also refuse/normalize these inbound IDs, matching the client gate.

3. **`src/components/marketing/IndustryDropdownPicker.tsx`** — filter `INDUSTRY_GROUPS[].ids` through `filterVisibleIds()` and drop any group that becomes empty, so the dropdown on `/for-business` and signup no longer lists medical entries.

4. **`src/components/marketing/IndustrySelector.tsx`** — wrap `INDUSTRY_LIST` with `filterVisibleIndustries()` before rendering the sticky chip bar.

5. **`src/components/social/IndustryTemplateSelector.tsx`** — apply `filterVisibleIndustries()` to the platform_admin branch of `visibleIndustries` so admins don't see medical templates either (tenant branch is already industry-scoped to the company, which is fine).

6. **Regenerate sitemap** — run `scripts/generate-sitemap.ts` after the change so `/for-business/<medical>` URLs drop out of `public/sitemap.xml`.

## Out of scope
- No DB migration. Existing companies on medical verticals keep their rows (`industry_vertical`, packs, demo accounts). They simply stop being offered to new visitors.
- No change to `MedicalComplianceNotice` — once gated, the notice won't render because medical industries are hidden upstream.
- Demo account seeder: reseed at `/dashboard/demo-seeder` if you want the 6 medical demos removed from the live registry; otherwise they stay dormant.

## Re-enable later
Empty `HIPAA_GATED_INDUSTRIES` in both files, regen sitemap, reseed demos.
