-- 1) demo_trials: drop plaintext password column
ALTER TABLE public.demo_trials DROP COLUMN IF EXISTS password;

-- Drop and recreate get_demo_trial_access without password
DROP FUNCTION IF EXISTS public.get_demo_trial_access(uuid);

CREATE FUNCTION public.get_demo_trial_access(p_trial_id uuid)
 RETURNS TABLE(trial_id uuid, company_id uuid, expires_at timestamp with time zone, status text, industry text, admin_email text, employee_email text, customer_email text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT dt.id, dt.company_id, dt.expires_at, dt.status, dt.industry,
         dt.admin_email, dt.employee_email, dt.customer_email
  FROM public.demo_trials dt
  WHERE dt.id = p_trial_id
    AND dt.status = 'active'
    AND dt.expires_at > now();
$$;

GRANT EXECUTE ON FUNCTION public.get_demo_trial_access(uuid) TO anon, authenticated;

-- 2) employee_registration_codes: drop anon from "mark as used" policy
DROP POLICY IF EXISTS "Users can mark code as used during registration" ON public.employee_registration_codes;

CREATE POLICY "Authenticated users can mark code as used during registration"
ON public.employee_registration_codes
FOR UPDATE
TO authenticated
USING (expires_at > now() AND used = false)
WITH CHECK (used = true);

-- 3) smart_websites: replace blanket public SELECT with safe RPC
DROP POLICY IF EXISTS "Public can read console visibility settings" ON public.smart_websites;

DROP FUNCTION IF EXISTS public.get_smart_website_public_config(text);

CREATE FUNCTION public.get_smart_website_public_config(p_subdomain text)
 RETURNS TABLE(
   id uuid, company_id uuid, subdomain text, is_published boolean,
   hero_headline text, hero_subheadline text, cta_button_text text, cta_button_url text,
   show_services boolean, show_hours boolean, show_contact boolean,
   show_chat_widget boolean, show_voice_widget boolean,
   show_about_section boolean, about_image_url text, about_header text,
   about_subheader text, about_paragraph text,
   background_style text, background_image_url text,
   gallery_images text[], show_gallery boolean,
   show_emergency_hours boolean, show_field_hours boolean, show_holidays boolean, show_blog boolean,
   show_console_appointments boolean, show_console_quotes boolean, show_console_tracking boolean,
   show_console_billing boolean, show_console_emergency boolean, show_console_feedback boolean,
   show_booking_widget boolean, booking_widget_mode text,
   enable_night_mode boolean, night_header text, night_subheadline text,
   night_start_hour integer, night_end_hour integer,
   emergency_cta_text text, emergency_cta_url text, logo_transparency_mode text,
   contact_name text, contact_title text, contact_phone text, contact_email text, contact_address text
 )
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT
    sw.id, sw.company_id, sw.subdomain, sw.is_published,
    sw.hero_headline, sw.hero_subheadline, sw.cta_button_text, sw.cta_button_url,
    sw.show_services, sw.show_hours, sw.show_contact, sw.show_chat_widget, sw.show_voice_widget,
    sw.show_about_section, sw.about_image_url, sw.about_header, sw.about_subheader, sw.about_paragraph,
    sw.background_style, sw.background_image_url, sw.gallery_images, sw.show_gallery,
    sw.show_emergency_hours, sw.show_field_hours, sw.show_holidays, sw.show_blog,
    sw.show_console_appointments, sw.show_console_quotes, sw.show_console_tracking,
    sw.show_console_billing, sw.show_console_emergency, sw.show_console_feedback,
    sw.show_booking_widget, sw.booking_widget_mode,
    sw.enable_night_mode, sw.night_header, sw.night_subheadline, sw.night_start_hour, sw.night_end_hour,
    sw.emergency_cta_text, sw.emergency_cta_url, sw.logo_transparency_mode,
    sw.contact_name, sw.contact_title, sw.contact_phone, sw.contact_email, sw.contact_address
  FROM public.smart_websites sw
  WHERE sw.subdomain = p_subdomain
    AND sw.is_published = true;
$$;

GRANT EXECUTE ON FUNCTION public.get_smart_website_public_config(text) TO anon, authenticated;

-- 4) technician_service_assignments: tighten manage policy to admins only
DROP POLICY IF EXISTS "Company admins can manage technician service assignments" ON public.technician_service_assignments;

CREATE POLICY "Company admins can manage technician service assignments"
ON public.technician_service_assignments
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'platform_admin'::public.app_role)
  OR (
    company_id = public.get_user_company_id(auth.uid())
    AND public.has_company_full_access(auth.uid())
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'platform_admin'::public.app_role)
  OR (
    company_id = public.get_user_company_id(auth.uid())
    AND public.has_company_full_access(auth.uid())
  )
);

-- 5) Storage: voice-audio — restrict insert/delete to service_role only
DROP POLICY IF EXISTS "Service role can insert voice audio" ON storage.objects;
DROP POLICY IF EXISTS "Service role can delete voice audio" ON storage.objects;

CREATE POLICY "Only service role can insert voice audio"
ON storage.objects
FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'voice-audio');

CREATE POLICY "Only service role can delete voice audio"
ON storage.objects
FOR DELETE
TO service_role
USING (bucket_id = 'voice-audio');

-- 6) Storage: job-photos — add ownership check on delete
DROP POLICY IF EXISTS "Authenticated users can delete job photos" ON storage.objects;

CREATE POLICY "Company members can delete their job photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'job-photos'
  AND (
    public.has_role(auth.uid(), 'platform_admin'::public.app_role)
    OR (storage.foldername(name))[1] = public.get_user_company_id(auth.uid())::text
  )
);
