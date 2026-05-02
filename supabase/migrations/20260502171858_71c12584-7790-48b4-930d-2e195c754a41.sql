DROP FUNCTION IF EXISTS public.list_companies_public();

CREATE OR REPLACE FUNCTION public.list_companies_public()
RETURNS TABLE(
  id uuid, name text, slug text, logo_url text,
  primary_color text, secondary_color text,
  industry_vertical text, service_categories text[],
  service_area_cities text[], service_area_zip_codes text[],
  subscription_tier text, phone text, business_phone text, contact_phone text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT c.id, c.name, c.slug, c.logo_url, c.primary_color, c.secondary_color,
         c.industry_vertical, c.service_categories,
         c.service_area_cities, c.service_area_zip_codes,
         c.subscription_tier, c.phone, c.business_phone, c.contact_phone
  FROM public.companies c
  WHERE COALESCE(c.is_demo, false) = false
    AND c.subscription_tier IS NOT NULL
    AND (c.trial_ends_at IS NULL OR c.trial_ends_at > now())
  ORDER BY c.name;
$function$;

CREATE OR REPLACE FUNCTION public.list_companies_for_customer(
  p_search text DEFAULT NULL,
  p_industry text DEFAULT NULL,
  p_zip text DEFAULT NULL
)
RETURNS TABLE(
  id uuid, name text, slug text, logo_url text,
  primary_color text, secondary_color text,
  industry_vertical text, service_categories text[],
  service_area_cities text[], service_area_zip_codes text[],
  subscription_tier text, phone text, business_phone text, contact_phone text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT c.id, c.name, c.slug, c.logo_url, c.primary_color, c.secondary_color,
         c.industry_vertical, c.service_categories,
         c.service_area_cities, c.service_area_zip_codes,
         c.subscription_tier, c.phone, c.business_phone, c.contact_phone
  FROM public.companies c
  WHERE COALESCE(c.is_demo, false) = false
    AND c.subscription_tier IS NOT NULL
    AND (c.trial_ends_at IS NULL OR c.trial_ends_at > now())
    AND (p_search IS NULL OR length(trim(p_search)) = 0 OR c.name ILIKE '%' || trim(p_search) || '%')
    AND (p_industry IS NULL OR length(trim(p_industry)) = 0 OR c.industry_vertical = p_industry)
    AND (
      p_zip IS NULL OR length(trim(p_zip)) = 0
      OR c.service_area_zip_codes IS NULL
      OR trim(p_zip) = ANY(c.service_area_zip_codes)
    )
  ORDER BY c.name
  LIMIT 100;
$function$;

GRANT EXECUTE ON FUNCTION public.list_companies_public() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_companies_for_customer(text, text, text) TO anon, authenticated;