## Goal

Customers must only see **live, subscribed (or in-trial) non-demo companies** when browsing the directory. Demo companies are platform-admin-only. Surface industry/service info so customers can choose by what each company actually offers.

## What I found

- `list_companies_public()` already excludes demo companies but returns no industry/subscription info and isn't used by the customer browse page.
- **`src/pages/CustomerPortalInstall.tsx` (line 138-157)** queries `from('companies')` directly. RLS likely lets it through, and there is **no `is_demo` filter** — so customers currently see demo accounts in the browse list.
- `get_company_public_info(p_slug)` already hides demo companies from non-admins on the per-company lookup. Good.
- `CompanySelector.tsx` already routes admins → `list_companies_admin`, others → `list_companies_public`. Good, but doesn't show industry.

## Changes

### 1. Database migration — extend the public listing RPC

Replace `public.list_companies_public()` to:
- Exclude `is_demo = true`.
- Include only **active subscribers**: `subscription_tier IS NOT NULL` AND (`trial_ends_at IS NULL OR trial_ends_at > now()` OR an active Stripe sub recorded in `subscribers`).
- Return additional fields useful for a customer-facing directory:
  - `industry_vertical`, `service_categories`, `service_area_cities`, `service_area_zip_codes`, `subscription_tier`, `secondary_color`, `phone`, `business_phone`, `contact_phone`.
- Stay `SECURITY DEFINER` and ordered by name.

Also add `public.list_companies_for_customer(p_search text, p_industry text, p_zip text)` (optional filters) wrapping the same rules so the customer portal can search/filter without touching the base table. Returns the same expanded columns and supports ILIKE name match, exact `industry_vertical`, and zip code overlap.

### 2. Frontend — replace direct `companies` browse query

- `src/pages/CustomerPortalInstall.tsx`: swap the `supabase.from('companies').select(...)` browse query for `supabase.rpc('list_companies_for_customer', { p_search, p_industry: null, p_zip: null })`.
- Add an industry filter dropdown (using canonical 18 industries from `industryIdAliases` / `IndustryNavLabels`) and a zip-code search field above the results.
- Render each card with: logo, name, an industry badge (using `industryNavLabels`), and a short service categories chip row.

### 3. CompanySelector polish (optional but consistent)

- Have non-admins call the new `list_companies_for_customer` (no filters) so they get industry context too. Show industry badge next to the name. Keep the demo badge for admins only.

### 4. Customer portal home directory link

- On `CustomerPortalHome.tsx`, when the signed-in customer has zero `customer_company_associations`, surface a clear "Browse companies" CTA that deep-links to `/customer-portal/install` (already the browse surface) — currently there's no nudge.

### 5. Memory updates

- Update `mem://features/portal/public-company-listing-standard` to state: **customer-facing listings must use `list_companies_for_customer` (or `list_companies_public`) — never query the `companies` table directly**. Demo companies are hidden from all non-admin surfaces.
- Add Core rule line: "Customer directory shows only non-demo, subscribed/in-trial companies; never query `companies` directly from customer surfaces."

## Files touched

- `supabase/migrations/<new>.sql` — replace `list_companies_public`, add `list_companies_for_customer`.
- `src/pages/CustomerPortalInstall.tsx` — swap browse query, add industry+zip filters.
- `src/components/ai/CompanySelector.tsx` — optional industry badge for non-admins.
- `src/pages/CustomerPortalHome.tsx` — empty-state CTA to browse.
- `.lovable/memory/features/portal/public-company-listing-standard.md` — updated standard.
- `.lovable/memory/index.md` — Core rule line.

## Verification

- Sign in as a demo customer → directory shows only real, subscribed companies. No `[DEMO]` rows.
- Sign in as platform admin via `CompanySelector` → demo badges still appear (admin RPC).
- `rg -n "from\\(['\"]companies['\"]\\)" src/pages/CustomerPortalInstall.tsx` returns no results after change.

## Out of scope

- No changes to admin pages (`Companies.tsx`, dashboards) — they legitimately query `companies` for management.
- No tier mapping changes (already corrected in earlier loops).
