DROP FUNCTION IF EXISTS public.get_company_public_info(text);
DROP FUNCTION IF EXISTS public.get_company_public_info_by_id(uuid);

CREATE FUNCTION public.get_company_public_info(p_slug text)
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
  public_app_url text,
  phone text,
  contact_phone text,
  business_phone text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    c.id, c.name, c.slug, c.logo_url, c.primary_color, c.secondary_color,
    c.service_area_cities, c.service_area_zip_codes, c.service_categories,
    c.public_app_url, c.phone, c.contact_phone, c.business_phone
  FROM companies c
  WHERE c.slug = p_slug;
$$;

CREATE FUNCTION public.get_company_public_info_by_id(p_id uuid)
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
  public_app_url text,
  phone text,
  contact_phone text,
  business_phone text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    c.id, c.name, c.slug, c.logo_url, c.primary_color, c.secondary_color,
    c.service_area_cities, c.service_area_zip_codes, c.service_categories,
    c.public_app_url, c.phone, c.contact_phone, c.business_phone
  FROM companies c
  WHERE c.id = p_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_company_public_info(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_company_public_info_by_id(uuid) TO anon, authenticated;