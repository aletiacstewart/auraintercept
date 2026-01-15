-- Create company_role_permissions table for feature access
CREATE TABLE public.company_role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  job_type public.employee_job_type NOT NULL,
  
  -- Feature Area Access
  can_access_appointments BOOLEAN DEFAULT true,
  can_access_customers BOOLEAN DEFAULT true,
  can_access_invoices BOOLEAN DEFAULT false,
  can_access_quotes BOOLEAN DEFAULT false,
  can_access_leads BOOLEAN DEFAULT false,
  can_access_inventory BOOLEAN DEFAULT false,
  can_access_campaigns BOOLEAN DEFAULT false,
  can_access_analytics BOOLEAN DEFAULT false,
  can_access_field_ops BOOLEAN DEFAULT false,
  can_access_warranties BOOLEAN DEFAULT false,
  
  -- Granular Permissions
  can_create BOOLEAN DEFAULT true,
  can_edit BOOLEAN DEFAULT true,
  can_delete BOOLEAN DEFAULT false,
  can_export BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(company_id, job_type)
);

-- Create company_role_agent_access table for AI agent access per role
CREATE TABLE public.company_role_agent_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  job_type public.employee_job_type NOT NULL,
  agent_type TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(company_id, job_type, agent_type)
);

-- Enable RLS
ALTER TABLE public.company_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_role_agent_access ENABLE ROW LEVEL SECURITY;

-- RLS for company_role_permissions
CREATE POLICY "Platform admins can manage all role permissions"
ON public.company_role_permissions
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'platform_admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'platform_admin'::public.app_role));

CREATE POLICY "Company admins can manage their company role permissions"
ON public.company_role_permissions
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'company_admin'::public.app_role) 
  AND company_id = public.get_user_company_id(auth.uid())
)
WITH CHECK (
  public.has_role(auth.uid(), 'company_admin'::public.app_role) 
  AND company_id = public.get_user_company_id(auth.uid())
);

CREATE POLICY "Employees can view their company role permissions"
ON public.company_role_permissions
FOR SELECT
TO authenticated
USING (company_id = public.get_user_company_id(auth.uid()));

-- RLS for company_role_agent_access
CREATE POLICY "Platform admins can manage all agent access"
ON public.company_role_agent_access
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'platform_admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'platform_admin'::public.app_role));

CREATE POLICY "Company admins can manage their company agent access"
ON public.company_role_agent_access
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'company_admin'::public.app_role) 
  AND company_id = public.get_user_company_id(auth.uid())
)
WITH CHECK (
  public.has_role(auth.uid(), 'company_admin'::public.app_role) 
  AND company_id = public.get_user_company_id(auth.uid())
);

CREATE POLICY "Employees can view their company agent access"
ON public.company_role_agent_access
FOR SELECT
TO authenticated
USING (company_id = public.get_user_company_id(auth.uid()));

-- Function to check if user has access to an AI agent (respects company customizations)
CREATE OR REPLACE FUNCTION public.has_agent_access(_user_id uuid, _agent_type text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- Platform admin always has access
    public.has_role(_user_id, 'platform_admin'::public.app_role)
    OR
    -- Company admin always has access
    public.has_role(_user_id, 'company_admin'::public.app_role)
    OR
    -- Check company-specific agent access for employee's job types
    EXISTS (
      SELECT 1
      FROM public.company_role_agent_access cra
      JOIN public.employee_job_assignments eja ON eja.job_type = cra.job_type
      WHERE eja.employee_id = _user_id
        AND cra.company_id = public.get_user_company_id(_user_id)
        AND cra.agent_type = _agent_type
        AND cra.is_enabled = true
    )
$$;

-- Function to check if user has feature access (respects company customizations)
CREATE OR REPLACE FUNCTION public.has_feature_access(_user_id uuid, _feature text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- Platform admin always has access
    public.has_role(_user_id, 'platform_admin'::public.app_role)
    OR
    -- Company admin always has access
    public.has_role(_user_id, 'company_admin'::public.app_role)
    OR
    -- Check company-specific feature access
    EXISTS (
      SELECT 1
      FROM public.company_role_permissions crp
      JOIN public.employee_job_assignments eja ON eja.job_type = crp.job_type
      WHERE eja.employee_id = _user_id
        AND crp.company_id = public.get_user_company_id(_user_id)
        AND (
          (_feature = 'appointments' AND crp.can_access_appointments = true) OR
          (_feature = 'customers' AND crp.can_access_customers = true) OR
          (_feature = 'invoices' AND crp.can_access_invoices = true) OR
          (_feature = 'quotes' AND crp.can_access_quotes = true) OR
          (_feature = 'leads' AND crp.can_access_leads = true) OR
          (_feature = 'inventory' AND crp.can_access_inventory = true) OR
          (_feature = 'campaigns' AND crp.can_access_campaigns = true) OR
          (_feature = 'analytics' AND crp.can_access_analytics = true) OR
          (_feature = 'field_ops' AND crp.can_access_field_ops = true) OR
          (_feature = 'warranties' AND crp.can_access_warranties = true)
        )
    )
$$;

-- Add updated_at trigger for company_role_permissions
CREATE TRIGGER update_company_role_permissions_updated_at
BEFORE UPDATE ON public.company_role_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();