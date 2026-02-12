
## Show All Registered Companies on Customer Portal Homepage

### Problem
The `CompanySelector` component queries the `companies` table directly, but RLS policies only allow users to see their own company (`get_user_company_id(auth.uid()) = id`). Customers are not company members, so they see zero results -- "No companies available."

### Solution
Create a new `SECURITY DEFINER` database function that returns public-safe company info for all companies, similar to the existing `get_company_public_info` (which only returns one company by slug). Then update `CompanySelector` to call this RPC instead of querying the table directly.

### Steps

**1. Create a new database function `list_companies_public`**

A `SECURITY DEFINER` RPC that returns `id, name, slug, logo_url, primary_color` for all companies, ordered by name. This bypasses RLS safely since it only exposes non-sensitive public fields.

```sql
CREATE OR REPLACE FUNCTION public.list_companies_public()
RETURNS TABLE(id uuid, name text, slug text, logo_url text, primary_color text)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT c.id, c.name, c.slug, c.logo_url, c.primary_color
  FROM companies c
  ORDER BY c.name;
$$;
```

**2. Update `CompanySelector` component**

- **File:** `src/components/ai/CompanySelector.tsx`
- Change the query from `supabase.from('companies').select(...)` to `supabase.rpc('list_companies_public')`
- This ensures all customers (regardless of auth state) can see every registered company

### Files to Modify
- Database: new migration for `list_companies_public()` function
- `src/components/ai/CompanySelector.tsx` -- switch query to use the new RPC
