DROP FUNCTION IF EXISTS public.get_company_public_info_by_id(uuid);

CREATE FUNCTION public.get_company_public_info_by_id(p_id uuid)
 RETURNS TABLE(
   id uuid, name text, slug text, logo_url text, primary_color text, secondary_color text,
   service_area_cities text[], service_area_zip_codes text[], service_categories text[],
   public_app_url text, phone text, contact_phone text, business_phone text,
   dispatch_phone text, email text, contact_email text, contact_address text, address text,
   subscription_tier text, trial_ends_at timestamptz,
   review_google_url text, review_facebook_url text, review_yelp_url text
 )
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT 
    c.id, c.name, c.slug, c.logo_url, c.primary_color, c.secondary_color,
    c.service_area_cities, c.service_area_zip_codes, c.service_categories,
    c.public_app_url, c.phone, c.contact_phone, c.business_phone,
    c.dispatch_phone, c.email, c.contact_email, c.contact_address, c.address,
    c.subscription_tier, c.trial_ends_at,
    c.review_google_url, c.review_facebook_url, c.review_yelp_url
  FROM companies c
  WHERE c.id = p_id;
$$;