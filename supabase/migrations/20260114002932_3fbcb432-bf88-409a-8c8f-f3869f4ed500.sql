-- Fix: Companies table public exposure
-- Create a public view with only non-sensitive fields

-- Step 1: Create a public view for company info that only exposes safe fields
CREATE OR REPLACE VIEW public.companies_public
WITH (security_invoker = on) AS
SELECT 
  id,
  name,
  slug,
  logo_url,
  primary_color,
  secondary_color,
  service_area_cities,
  service_area_zip_codes,
  service_categories,
  public_app_url
FROM public.companies;

-- Step 2: Grant access to the view for public access
GRANT SELECT ON public.companies_public TO anon, authenticated;

-- Step 3: Remove the overly permissive public policy on the base table
DROP POLICY IF EXISTS "Anyone can view company public info" ON public.companies;

-- Note: The remaining policies properly restrict access:
-- - Company admins can view their own company (via get_user_company_id match)
-- - Employees can view their own company (via get_user_company_id match)
-- - Platform admins can view all companies (via has_role check)
-- 
-- Public/anonymous access should use the companies_public view instead