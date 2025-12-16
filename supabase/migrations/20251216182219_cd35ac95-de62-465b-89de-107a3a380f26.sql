-- Allow platform admins to manage all FAQs
CREATE POLICY "Platform admins can manage all FAQs" 
ON public.faqs 
FOR ALL 
USING (has_role(auth.uid(), 'platform_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'platform_admin'::app_role));

-- Allow platform admins to manage all business hours
CREATE POLICY "Platform admins can manage all business hours" 
ON public.business_hours 
FOR ALL 
USING (has_role(auth.uid(), 'platform_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'platform_admin'::app_role));

-- Allow platform admins to manage all knowledge documents
CREATE POLICY "Platform admins can manage all documents" 
ON public.knowledge_documents 
FOR ALL 
USING (has_role(auth.uid(), 'platform_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'platform_admin'::app_role));