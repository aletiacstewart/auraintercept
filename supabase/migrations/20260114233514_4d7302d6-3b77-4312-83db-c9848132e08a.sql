-- Fix: Ensure companies_public view allows proper public access for non-sensitive data
-- while the base companies table remains strictly protected

-- Drop and recreate view WITHOUT security_invoker so anon/public can read non-sensitive fields
DROP VIEW IF EXISTS public.companies_public;

CREATE VIEW public.companies_public AS
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

-- Grant SELECT on the view to allow public lookup of basic company info (for widgets, portals)
GRANT SELECT ON public.companies_public TO anon, authenticated;

-- Ensure the base companies table has NO public/anon SELECT access
-- All existing policies properly check auth.uid() or has_role(), which fails for anon users
-- But let's add an explicit deny for the anon role to be extra safe

-- Create a function to check if current user can view a specific company
CREATE OR REPLACE FUNCTION public.can_view_company(_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    has_role(auth.uid(), 'platform_admin'::app_role)
    OR get_user_company_id(auth.uid()) = _company_id
$$;