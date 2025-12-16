-- Allow platform admins to manage (INSERT, UPDATE, DELETE) all services
CREATE POLICY "Platform admins can manage all services" 
ON public.services 
FOR ALL 
USING (has_role(auth.uid(), 'platform_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'platform_admin'::app_role));