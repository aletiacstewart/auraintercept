-- Add full access for platform admins to warranty_policies
CREATE POLICY "Platform admins can manage all warranty policies"
ON public.warranty_policies FOR ALL
USING (has_role(auth.uid(), 'platform_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'platform_admin'::app_role));

-- Add full access for platform admins to marketing_campaigns
CREATE POLICY "Platform admins can manage all marketing campaigns"
ON public.marketing_campaigns FOR ALL
USING (has_role(auth.uid(), 'platform_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'platform_admin'::app_role));