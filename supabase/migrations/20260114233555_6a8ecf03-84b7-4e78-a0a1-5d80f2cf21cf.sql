-- Revert: Remove the overly permissive anon policy that exposes all company data
DROP POLICY IF EXISTS "Public can view basic company info via slug lookup" ON public.companies;

-- Better approach: Create a security definer function for public company lookups
-- This function only returns non-sensitive fields and bypasses RLS safely

CREATE OR REPLACE FUNCTION public.get_company_public_info(p_slug text)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  logo_url text,
  primary_color text,
  secondary_color text,
  service_area_cities text[],
  service_area_zip_codes text[],
  service_categories text[],
  public_app_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    c.id,
    c.name,
    c.slug,
    c.logo_url,
    c.primary_color,
    c.secondary_color,
    c.service_area_cities,
    c.service_area_zip_codes,
    c.service_categories,
    c.public_app_url
  FROM companies c
  WHERE c.slug = p_slug;
$$;

-- Also create a version that looks up by ID
CREATE OR REPLACE FUNCTION public.get_company_public_info_by_id(p_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  logo_url text,
  primary_color text,
  secondary_color text,
  service_area_cities text[],
  service_area_zip_codes text[],
  service_categories text[],
  public_app_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    c.id,
    c.name,
    c.slug,
    c.logo_url,
    c.primary_color,
    c.secondary_color,
    c.service_area_cities,
    c.service_area_zip_codes,
    c.service_categories,
    c.public_app_url
  FROM companies c
  WHERE c.id = p_id;
$$;

-- Grant execute on these functions to anon and authenticated
GRANT EXECUTE ON FUNCTION public.get_company_public_info(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_company_public_info_by_id(uuid) TO anon, authenticated;