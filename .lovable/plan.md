# Hide Demo Accounts From Real Users

## The actual problem

A signed-up customer or employee should never see the seeded demo companies (Demo Core / Boost / Pro / Elite) or the trial-seeded `[DEMO] Charles' HVAC` in any list. Right now they leak in three places:

1. **DB rows aren't flagged.** Only `[DEMO] Charles' HVAC` has `is_demo=true`. The four tier-demo companies (`Demo Core`, `Demo Boost`, `Demo Pro`, `Demo Elite`) have `is_demo=false` even though `seed-demo-accounts-v2` created them. Aura Intercept is the only real company.
2. **The public RPC `list_companies_public` returns every company unfiltered** — used by the Customer Portal Console "Select a Company" picker, the public `/portal` directory and the embedded chat widget company picker.
3. **The seeder doesn't set `is_demo=true`** on insert/update, so re-seeding re-creates the leak.

## Fix (3 parts, one migration + one edge-function tweak + one front-end guard)

### 1. Migration — backfill the flag and filter the RPCs

```sql
-- Backfill: any company created by the demo seeder is a demo
UPDATE public.companies
SET is_demo = true
WHERE slug IN ('demo-core','demo-boost','demo-pro','demo-elite')
   OR name ILIKE '[DEMO]%'
   OR name ILIKE 'Demo %';

-- Public listing now hides demos
CREATE OR REPLACE FUNCTION public.list_companies_public()
RETURNS TABLE(id uuid, name text, slug text, logo_url text, primary_color text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT c.id, c.name, c.slug, c.logo_url, c.primary_color
  FROM companies c
  WHERE COALESCE(c.is_demo, false) = false
  ORDER BY c.name;
$$;

-- Public per-company lookup also blocks demo slugs to non-demo viewers
CREATE OR REPLACE FUNCTION public.get_company_public_info(p_slug text)
RETURNS TABLE(...same columns...)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT c.id, c.name, c.slug, c.logo_url, c.primary_color, c.secondary_color,
         c.service_area_cities, c.service_area_zip_codes, c.service_categories,
         c.public_app_url, c.phone, c.contact_phone, c.business_phone
  FROM companies c
  WHERE c.slug = p_slug
    AND COALESCE(c.is_demo, false) = false;
$$;

-- Admin-only helper for screens that legitimately need to see demos
CREATE OR REPLACE FUNCTION public.list_companies_admin()
RETURNS TABLE(id uuid, name text, slug text, logo_url text,
              primary_color text, is_demo boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT c.id, c.name, c.slug, c.logo_url, c.primary_color, c.is_demo
  FROM companies c
  WHERE public.has_role(auth.uid(), 'platform_admin')
  ORDER BY c.is_demo, c.name;
$$;
```

### 2. Edge function — `seed-demo-accounts-v2` adds `is_demo: true`

Add `is_demo: true` to `companyPayload` in `seedTier()` so future re-seeds stay flagged.

### 3. Front-end — Customer Portal Console picker

`src/components/ai/CompanySelector.tsx` is shown to platform admins (Admin Preview screenshot) AND embedded widgets. Switch it to:
- Call `list_companies_admin` when the viewer is a `platform_admin`, with a "DEMO" pill on flagged rows.
- Call `list_companies_public` (now demo-free) for everyone else.

Also harden `CustomerCompanyPortal.tsx` so direct visits to `/c/demo-core` etc. return "company not found" for non-admins (the RPC change already enforces this, but show a clean 404).

## What this does NOT change

- Nothing about how demo accounts log in. The 12 demo logins keep working, land on their company, and see their own seeded data — they just stop being visible to anyone outside.
- No RLS rewrite on `companies` itself. Demo rows still exist; they're just filtered out of public-facing functions. RLS for member-scoped reads (own-company) is unchanged.
- Aura Intercept stays visible (it's your real company, `is_demo=false`).

## Out of scope (flag if you want it next)

- Hiding demo companies from internal admin dashboards (e.g. PlatformAdminDashboard counts). I'd recommend keeping them visible there but tagged, so you can audit/reseed.
- Changing the customer-facing `/portal` listing styling.
