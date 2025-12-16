-- Allow employees to view their company's integrations (read-only)
CREATE POLICY "Employees can view their company integrations"
ON public.tenant_integrations
FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

-- Allow employees to view their company's AI agent configs (read-only)
CREATE POLICY "Employees can view their company agent configs"
ON public.ai_agent_configs
FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));