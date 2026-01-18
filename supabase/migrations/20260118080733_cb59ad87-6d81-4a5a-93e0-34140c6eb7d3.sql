-- Drop and recreate the function with new return type
DROP FUNCTION IF EXISTS get_website_public_data(text);

CREATE OR REPLACE FUNCTION get_website_public_data(p_subdomain text)
RETURNS TABLE (
  id uuid,
  company_id uuid,
  company_name text,
  subdomain text,
  logo_url text,
  primary_color text,
  hero_headline text,
  hero_subheadline text,
  cta_text text,
  cta_url text,
  show_services boolean,
  show_hours boolean,
  show_contact boolean,
  show_chat boolean,
  show_voice boolean,
  background_style text,
  custom_domain text,
  is_published boolean,
  subscription_tier text,
  trial_ends_at timestamptz,
  show_about_section boolean,
  about_image_url text,
  about_header text,
  about_subheader text,
  about_paragraph text,
  enable_night_mode boolean,
  night_header text,
  night_subheadline text,
  night_start_hour integer,
  night_end_hour integer,
  emergency_cta_text text,
  emergency_cta_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sw.id,
    sw.company_id,
    c.name as company_name,
    sw.subdomain,
    sw.logo_url,
    sw.primary_color,
    sw.hero_headline,
    sw.hero_subheadline,
    sw.cta_text,
    sw.cta_url,
    sw.show_services,
    sw.show_hours,
    sw.show_contact,
    sw.show_chat,
    sw.show_voice,
    sw.background_style,
    sw.custom_domain,
    sw.is_published,
    s.tier as subscription_tier,
    s.trial_ends_at,
    sw.show_about_section,
    sw.about_image_url,
    sw.about_header,
    sw.about_subheader,
    sw.about_paragraph,
    sw.enable_night_mode,
    sw.night_header,
    sw.night_subheadline,
    sw.night_start_hour,
    sw.night_end_hour,
    sw.emergency_cta_text,
    sw.emergency_cta_url
  FROM smart_websites sw
  JOIN companies c ON c.id = sw.company_id
  LEFT JOIN subscriptions s ON s.company_id = sw.company_id
  WHERE sw.subdomain = p_subdomain
    AND sw.is_published = true;
END;
$$;