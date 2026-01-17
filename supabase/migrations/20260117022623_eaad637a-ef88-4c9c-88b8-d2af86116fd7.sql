-- Function to get public website data by subdomain
CREATE OR REPLACE FUNCTION public.get_website_public_data(p_subdomain text)
RETURNS TABLE (
  website_id uuid,
  company_id uuid,
  company_name text,
  company_slug text,
  logo_url text,
  primary_color text,
  secondary_color text,
  phone text,
  email text,
  address text,
  hero_headline text,
  hero_subheadline text,
  cta_button_text text,
  cta_button_url text,
  show_services boolean,
  show_hours boolean,
  show_contact boolean,
  show_chat_widget boolean,
  background_style text,
  background_image_url text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    sw.id as website_id,
    c.id as company_id,
    c.name as company_name,
    c.slug as company_slug,
    c.logo_url,
    c.primary_color,
    c.secondary_color,
    COALESCE(c.phone, ti.twilio_phone_number) as phone,
    c.email,
    c.address,
    sw.hero_headline,
    sw.hero_subheadline,
    sw.cta_button_text,
    sw.cta_button_url,
    sw.show_services,
    sw.show_hours,
    sw.show_contact,
    sw.show_chat_widget,
    sw.background_style,
    sw.background_image_url
  FROM public.smart_websites sw
  JOIN public.companies c ON c.id = sw.company_id
  LEFT JOIN public.tenant_integrations ti ON ti.company_id = c.id
  WHERE sw.subdomain = p_subdomain
    AND sw.is_published = true;
$$;

-- Function to check visitor limit
CREATE OR REPLACE FUNCTION public.check_visitor_limit(p_website_id uuid)
RETURNS TABLE (
  allowed boolean,
  current_views integer,
  monthly_limit integer,
  usage_percentage numeric
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    COALESCE(sm.page_views, 0) < sw.monthly_visitor_limit as allowed,
    COALESCE(sm.page_views, 0) as current_views,
    sw.monthly_visitor_limit as monthly_limit,
    CASE 
      WHEN sw.monthly_visitor_limit > 0 
      THEN ROUND((COALESCE(sm.page_views, 0)::numeric / sw.monthly_visitor_limit::numeric) * 100, 1)
      ELSE 0
    END as usage_percentage
  FROM public.smart_websites sw
  LEFT JOIN public.site_metrics sm ON sm.website_id = sw.id 
    AND sm.month_year = to_char(now(), 'YYYY-MM')
  WHERE sw.id = p_website_id;
$$;

-- Function to increment site metrics
CREATE OR REPLACE FUNCTION public.increment_site_metric(
  p_website_id uuid,
  p_metric text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_company_id uuid;
  v_month_year text;
BEGIN
  v_month_year := to_char(now(), 'YYYY-MM');
  
  SELECT company_id INTO v_company_id
  FROM public.smart_websites
  WHERE id = p_website_id;
  
  IF v_company_id IS NULL THEN
    RETURN;
  END IF;
  
  INSERT INTO public.site_metrics (website_id, company_id, month_year)
  VALUES (p_website_id, v_company_id, v_month_year)
  ON CONFLICT (website_id, month_year) DO NOTHING;
  
  IF p_metric = 'page_views' THEN
    UPDATE public.site_metrics
    SET page_views = page_views + 1, updated_at = now()
    WHERE website_id = p_website_id AND month_year = v_month_year;
  ELSIF p_metric = 'unique_visitors' THEN
    UPDATE public.site_metrics
    SET unique_visitors = unique_visitors + 1, updated_at = now()
    WHERE website_id = p_website_id AND month_year = v_month_year;
  ELSIF p_metric = 'chat_interactions' THEN
    UPDATE public.site_metrics
    SET chat_interactions = chat_interactions + 1, updated_at = now()
    WHERE website_id = p_website_id AND month_year = v_month_year;
  ELSIF p_metric = 'booking_clicks' THEN
    UPDATE public.site_metrics
    SET booking_clicks = booking_clicks + 1, updated_at = now()
    WHERE website_id = p_website_id AND month_year = v_month_year;
  END IF;
END;
$$;

-- Function to get website by custom domain
CREATE OR REPLACE FUNCTION public.get_website_by_custom_domain(p_domain text)
RETURNS TABLE (
  website_id uuid,
  subdomain text,
  company_id uuid
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    id as website_id,
    subdomain,
    company_id
  FROM public.smart_websites
  WHERE custom_domain = p_domain
    AND domain_verified = true
    AND is_published = true;
$$;