ALTER TABLE public.smart_websites
  ADD COLUMN IF NOT EXISTS show_booking_widget boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS booking_widget_mode text NOT NULL DEFAULT 'inline'
    CHECK (booking_widget_mode IN ('inline','modal','hero_cta'));

DROP FUNCTION IF EXISTS public.get_website_public_data(text);

CREATE OR REPLACE FUNCTION public.get_website_public_data(website_subdomain text)
 RETURNS TABLE(id uuid, company_id uuid, company_name text, company_logo_url text, primary_color text, hero_headline text, hero_subheadline text, cta_text text, cta_url text, show_services boolean, show_hours boolean, show_contact boolean, show_chat_widget boolean, show_voice_widget boolean, show_blog boolean, background_style text, is_published boolean, subscription_tier text, trial_ends_at timestamp with time zone, show_about_section boolean, about_image_url text, about_header text, about_subheader text, about_paragraph text, night_mode_enabled boolean, night_header text, night_subheadline text, night_start_hour integer, night_end_hour integer, night_cta_text text, night_cta_url text, gallery_images text[], background_image_url text, logo_transparency_mode text, show_gallery boolean, show_booking_widget boolean, booking_widget_mode text, company_slug text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    sw.show_gallery,
    sw.show_booking_widget,
    sw.booking_widget_mode,
    c.slug as company_slug
  FROM smart_websites sw
  JOIN companies c ON c.id = sw.company_id
  WHERE sw.subdomain = website_subdomain
    AND sw.is_published = true;
END;
$function$;