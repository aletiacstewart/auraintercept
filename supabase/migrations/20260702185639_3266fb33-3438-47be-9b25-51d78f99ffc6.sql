
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

-- Backfill: mark any company whose name starts with "Demo" (case-insensitive) as a demo tenant.
UPDATE public.companies SET is_demo = true WHERE lower(name) LIKE 'demo%' AND is_demo = false;

CREATE INDEX IF NOT EXISTS idx_companies_is_demo ON public.companies(is_demo);

-- Hide demo tenants from the public company list used by customer-facing selectors.
CREATE OR REPLACE FUNCTION public.list_companies_public()
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
    AND COALESCE(c.is_demo, false) = false
  ORDER BY c.name;
$function$;
