-- Drop and recreate the function with new return type
DROP FUNCTION IF EXISTS get_website_public_data(text);

CREATE OR REPLACE FUNCTION get_website_public_data(website_subdomain text)
RETURNS TABLE (
  id uuid,
  company_id uuid,
  company_name text,
  company_logo_url text,
  hero_headline text,
  hero_subheadline text,
  cta_text text,
  cta_url text,
  primary_color text,
  background_style text,
  is_published boolean,
  show_services boolean,
  show_hours boolean,
  show_contact boolean,
  show_chat_widget boolean,
  show_voice_widget boolean,
  show_about_section boolean,
  about_header text,
  about_subheader text,
  about_paragraph text,
  about_image_url text,
  night_mode_enabled boolean,
  night_start_hour integer,
  night_end_hour integer,
  night_header text,
  night_subheadline text,
  night_cta_text text,
  night_cta_url text,
  subscription_tier text,
  trial_ends_at timestamptz,
  gallery_images jsonb,
  background_image_url text,
  logo_transparency_mode text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sw.id,
    sw.company_id,
    c.name as company_name,
    c.logo_url as company_logo_url,
    sw.hero_headline,
    sw.hero_subheadline,
    sw.cta_text,
    sw.cta_url,
    sw.primary_color,
    sw.background_style,
    sw.is_published,
    sw.show_services,
    sw.show_hours,
    sw.show_contact,
    sw.show_chat_widget,
    sw.show_voice_widget,
    sw.show_about_section,
    sw.about_header,
    sw.about_subheader,
    sw.about_paragraph,
    sw.about_image_url,
    sw.night_mode_enabled,
    sw.night_start_hour,
    sw.night_end_hour,
    sw.night_header,
    sw.night_subheadline,
    sw.night_cta_text,
    sw.night_cta_url,
    c.subscription_tier,
    c.trial_ends_at,
    sw.gallery_images,
    sw.background_image_url,
    sw.logo_transparency_mode
  FROM smart_websites sw
  JOIN companies c ON c.id = sw.company_id
  WHERE c.slug = website_subdomain
  AND sw.is_published = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;