-- Allow platform admins to manage all agent configs
CREATE POLICY "Platform admins can manage all agent configs" 
ON public.ai_agent_configs 
FOR ALL 
USING (has_role(auth.uid(), 'platform_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'platform_admin'::app_role));