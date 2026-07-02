
DELETE FROM public.companies WHERE is_demo = true;
DELETE FROM public.user_roles WHERE role = 'demo_rep';

DROP TABLE IF EXISTS public.demo_trials CASCADE;
DROP FUNCTION IF EXISTS public.get_demo_trial_access(uuid) CASCADE;

DROP FUNCTION IF EXISTS public.list_companies_admin() CASCADE;
DROP FUNCTION IF EXISTS public.list_companies_public() CASCADE;

CREATE FUNCTION public.list_companies_admin()
  RETURNS TABLE(id uuid, name text, slug text, logo_url text, primary_color text)
  LANGUAGE sql
  STABLE SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
  SELECT c.id, c.name, c.slug, c.logo_url, c.primary_color
  FROM public.companies c
  WHERE public.has_role(auth.uid(), 'platform_admin'::public.app_role)
  ORDER BY c.name;
$function$;

CREATE FUNCTION public.list_companies_public()
  RETURNS TABLE(id uuid, name text, slug text, logo_url text, primary_color text, secondary_color text, industry_vertical text, service_categories text[], service_area_cities text[], service_area_zip_codes text[], subscription_tier text, phone text, business_phone text, contact_phone text)
  LANGUAGE sql
  STABLE SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
  SELECT c.id, c.name, c.slug, c.logo_url, c.primary_color, c.secondary_color,
         c.industry_vertical, c.service_categories,
         c.service_area_cities, c.service_area_zip_codes,
         c.subscription_tier, c.phone, c.business_phone, c.contact_phone
  FROM public.companies c
  WHERE c.subscription_tier IS NOT NULL
    AND (c.trial_ends_at IS NULL OR c.trial_ends_at > now())
  ORDER BY c.name;
$function$;

GRANT EXECUTE ON FUNCTION public.list_companies_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_companies_public() TO anon, authenticated;

DROP INDEX IF EXISTS public.idx_companies_is_demo;
ALTER TABLE public.companies DROP COLUMN IF EXISTS is_demo;
