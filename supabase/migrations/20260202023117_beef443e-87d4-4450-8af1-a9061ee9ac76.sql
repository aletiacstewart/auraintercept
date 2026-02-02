-- Drop and recreate get_website_public_data function to include show_blog field
DROP FUNCTION IF EXISTS get_website_public_data(TEXT);

CREATE FUNCTION get_website_public_data(website_subdomain TEXT)
RETURNS TABLE(
  id UUID,
  company_id UUID,
  company_name TEXT,
  company_logo_url TEXT,
  primary_color TEXT,
  hero_headline TEXT,
  hero_subheadline TEXT,
  cta_text TEXT,
  cta_url TEXT,
  show_services BOOLEAN,
  show_hours BOOLEAN,
  show_contact BOOLEAN,
  show_chat_widget BOOLEAN,
  show_voice_widget BOOLEAN,
  show_blog BOOLEAN,
  background_style TEXT,
  is_published BOOLEAN,
  subscription_tier TEXT,
  trial_ends_at TIMESTAMPTZ,
  show_about_section BOOLEAN,
  about_image_url TEXT,
  about_header TEXT,
  about_subheader TEXT,
  about_paragraph TEXT,
  night_mode_enabled BOOLEAN,
  night_header TEXT,
  night_subheadline TEXT,
  night_start_hour INTEGER,
  night_end_hour INTEGER,
  night_cta_text TEXT,
  night_cta_url TEXT,
  gallery_images TEXT[],
  background_image_url TEXT,
  logo_transparency_mode TEXT,
  show_gallery BOOLEAN
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sw.id,
    sw.company_id,
    c.name as company_name,
    c.logo_url as company_logo_url,
    c.primary_color,
    sw.hero_headline,
    sw.hero_subheadline,
    sw.cta_button_text as cta_text,
    sw.cta_button_url as cta_url,
    sw.show_services,
    sw.show_hours,
    sw.show_contact,
    sw.show_chat_widget,
    sw.show_voice_widget,
    sw.show_blog,
    sw.background_style,
    sw.is_published,
    c.subscription_tier,
    c.trial_ends_at,
    sw.show_about_section,
    sw.about_image_url,
    sw.about_header,
    sw.about_subheader,
    sw.about_paragraph,
    sw.enable_night_mode as night_mode_enabled,
    sw.night_header,
    sw.night_subheadline,
    sw.night_start_hour,
    sw.night_end_hour,
    sw.emergency_cta_text as night_cta_text,
    sw.emergency_cta_url as night_cta_url,
    sw.gallery_images,
    sw.background_image_url,
    sw.logo_transparency_mode,
    sw.show_gallery
  FROM smart_websites sw
  JOIN companies c ON c.id = sw.company_id
  WHERE sw.subdomain = website_subdomain
    AND sw.is_published = true;
END;
$$;