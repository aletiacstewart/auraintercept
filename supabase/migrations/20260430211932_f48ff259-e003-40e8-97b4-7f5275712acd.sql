-- 1. Backfill is_demo for known demo seed companies
UPDATE public.companies
SET is_demo = true
WHERE COALESCE(is_demo, false) = false
  AND (
    slug IN ('demo-core','demo-boost','demo-pro','demo-elite')
    OR name ILIKE '[DEMO]%'
    OR name ILIKE 'Demo %'
  );

-- 2. Public listing — hide demo companies
CREATE OR REPLACE FUNCTION public.list_companies_public()
RETURNS TABLE(id uuid, name text, slug text, logo_url text, primary_color text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT c.id, c.name, c.slug, c.logo_url, c.primary_color
  FROM companies c
  WHERE COALESCE(c.is_demo, false) = false
  ORDER BY c.name;
$function$;

-- 3. Per-company public lookup — hide demo companies from non-admins
CREATE OR REPLACE FUNCTION public.get_company_public_info(p_slug text)
RETURNS TABLE(id uuid, name text, slug text, logo_url text, primary_color text, secondary_color text, service_area_cities text[], service_area_zip_codes text[], service_categories text[], public_app_url text, phone text, contact_phone text, business_phone text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    c.id, c.name, c.slug, c.logo_url, c.primary_color, c.secondary_color,
    c.service_area_cities, c.service_area_zip_codes, c.service_categories,
    c.public_app_url, c.phone, c.contact_phone, c.business_phone
  FROM companies c
  WHERE c.slug = p_slug
    AND (
      COALESCE(c.is_demo, false) = false
      OR public.has_role(auth.uid(), 'platform_admin'::public.app_role)
    );
$function$;

-- 4. Admin-only directory (includes demos, with flag)
CREATE OR REPLACE FUNCTION public.list_companies_admin()
RETURNS TABLE(id uuid, name text, slug text, logo_url text, primary_color text, is_demo boolean)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT c.id, c.name, c.slug, c.logo_url, c.primary_color, COALESCE(c.is_demo, false) AS is_demo
  FROM companies c
  WHERE public.has_role(auth.uid(), 'platform_admin'::public.app_role)
  ORDER BY COALESCE(c.is_demo, false), c.name;
$function$;

REVOKE ALL ON FUNCTION public.list_companies_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_companies_admin() TO authenticated;