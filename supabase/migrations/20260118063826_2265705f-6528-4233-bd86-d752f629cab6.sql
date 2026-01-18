-- Add INSERT policy for platform admins on email_templates
CREATE POLICY "Platform admins can manage any email templates"
ON public.email_templates FOR ALL
USING (has_role(auth.uid(), 'platform_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'platform_admin'::app_role));

-- Add INSERT policy for platform admins on sms_templates  
CREATE POLICY "Platform admins can manage any SMS templates"
ON public.sms_templates FOR ALL
USING (has_role(auth.uid(), 'platform_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'platform_admin'::app_role));