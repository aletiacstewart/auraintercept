
# Hide Medical / Health Verticals Until HIPAA Is Resolved

Goal: remove `home_health`, `physical_therapy`, `occupational_therapy`, `hospice` (and any "medical"-adjacent copy) from every customer-facing surface so we don't sell into HIPAA-regulated industries before BAAs and safeguards are in place. **Keep the data and code in place** so we can re-enable in one flag flip once HIPAA work lands.

## Approach: single feature flag, not deletion

Add one central allow-list rather than scrubbing 25+ files. Cleaner to revert later.

### 1. Central gate
- New constant in `src/lib/industryIdAliases.ts` (or a new `src/lib/industryVisibility.ts`):
  ```ts
  export const HIPAA_GATED_INDUSTRIES = new Set([
    'home_health','physical_therapy','occupational_therapy','hospice'
  ]);
  export const isIndustryVisible = (id) => !HIPAA_GATED_INDUSTRIES.has(id);
  ```
- Mirror in `supabase/functions/_shared/industry-aliases.ts` for edge functions.

### 2. Filter at every list source (one-liner each)
Apply `.filter(i => isIndustryVisible(i.id))` in:
- `src/lib/industryMarketingContent.ts` → `INDUSTRY_LIST` (drives `/for-business` cards, IndustrySelector, Start Demo)
- `src/lib/industryTemplates.ts` → signup dropdown (`SignUp.tsx`)
- `src/pages/DemoAccountSeeder.tsx` → demo seeding skips these 4
- `src/pages/SignUp.tsx` "Other / Custom" preset list
- `src/pages/Index.tsx` landing industry mentions
- `FastStartWizard` BUSINESS_TEMPLATES

### 3. Hide in marketing / documentation
- `src/components/documentation/MarketingSalesMasterPDF.tsx` — remove medical sections from generated PDF.
- `src/lib/auditIndustryQuestions.ts` — strip medical question sets from Free Audit.
- Any `/for-business/<slug>` route for the 4 IDs → return 404 / redirect to `/for-business`.

### 4. Sitemap & SEO
- `scripts/generate-sitemap.ts` — exclude gated slugs.
- `public/llms.txt`, `public/sitemap.xml` regen.
- Remove medical keywords from landing meta + hero copy in `Index.tsx`.

### 5. Demo accounts
- `supabase/functions/seed-demo-accounts-v2` and `DemoAccountSeeder.tsx` — skip the 4 verticals so the registry drops from 26 → 22 industries on next reseed. Existing seeded demos: either delete or leave inert (recommend delete via seeder script after flag flip).

### 6. Defensive runtime guard
- `useIndustryPack.ts`: if a company somehow has `industry_vertical` in the gated set (none today, but future-proof), fall back to generic pack and log a warning. Do **not** block their existing sessions.

### 7. Keep behind the scenes
- Industry pack rows in `industry_template_packs` table — **leave in DB**, untouched. The visibility filter is purely UI.
- All lib files (`industryWorkflows`, `industryKpiLabels`, etc.) — leave entries; they're harmless when nothing selects them.
- Memory files / docs referencing these verticals — leave as-is for when we re-enable.

## What "medical-adjacent" copy to scrub

Search and remove from public marketing only (`Index.tsx`, `ForBusiness.tsx`, landing components, PDFs):
- "home health", "hospice", "physical therapy", "occupational therapy"
- "medical", "clinic", "patient", "HIPAA" mentions in feature copy
- Industry icons / cards for these verticals

Keep internal docs (`.lovable/memory/**`) intact — that's our knowledge base.

## Validation

- Visit `/for-business`, `/signup`, `/`, `/audit` → confirm no medical verticals visible.
- Run `rg -i "home_health|physical_therapy|occupational_therapy|hospice"` on `src/pages/` + `src/components/landing/` + `src/components/marketing/` → should only show inside the gated filter or files we intentionally kept.
- Sitemap regen → no `/for-business/home-health` etc.
- Demo seeder run → 22 verticals.

## To revert later (one PR)

Empty the `HIPAA_GATED_INDUSTRIES` set, regen sitemap, reseed demos. Done.

---

## Open questions

1. **"Medical" scope** — just the 4 healthcare verticals, or also anything mentioning HIPAA / medical in marketing copy (e.g. compliance bullets that say "HIPAA-ready")? Recommend: hide the verticals **and** strip HIPAA claims so we don't make promises we can't back.
2. **Existing demo accounts** for the 4 verticals — delete now, or leave logged-in-able until next reseed? Recommend delete to avoid sales demos showcasing them.
3. **Industry packs in DB** — leave or soft-delete (set `is_active=false` if that column exists)? Recommend leave for fast revert.
