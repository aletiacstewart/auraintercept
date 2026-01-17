-- Drop and recreate the function with new return type
DROP FUNCTION IF EXISTS public.get_website_public_data(text);

CREATE OR REPLACE FUNCTION public.get_website_public_data(p_subdomain text)
 RETURNS TABLE(website_id uuid, company_id uuid, company_name text, company_slug text, logo_url text, primary_color text, secondary_color text, phone text, email text, address text, hero_headline text, hero_subheadline text, cta_button_text text, cta_button_url text, show_services boolean, show_hours boolean, show_contact boolean, show_chat_widget boolean, show_voice_widget boolean, background_style text, background_image_url text, subscription_tier text, trial_ends_at timestamp with time zone, show_about_section boolean, about_image_url text, about_header text, about_subheader text, about_paragraph text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    sw.show_voice_widget,
    sw.background_style,
    sw.background_image_url,
    c.subscription_tier,
    c.trial_ends_at,
    sw.show_about_section,
    sw.about_image_url,
    sw.about_header,
    sw.about_subheader,
    sw.about_paragraph
  FROM public.smart_websites sw
  JOIN public.companies c ON c.id = sw.company_id
  LEFT JOIN public.tenant_integrations ti ON ti.company_id = c.id
  WHERE sw.subdomain = p_subdomain
    AND sw.is_published = true;
$function$;