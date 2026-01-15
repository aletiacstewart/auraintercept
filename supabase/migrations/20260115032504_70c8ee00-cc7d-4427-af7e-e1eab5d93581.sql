-- Add 'manager' to the employee_job_type enum
ALTER TYPE public.employee_job_type ADD VALUE IF NOT EXISTS 'manager';

-- Update has_company_full_access to include manager role
CREATE OR REPLACE FUNCTION public.has_company_full_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    public.has_role(_user_id, 'company_admin'::public.app_role) OR
    public.has_job_type(_user_id, 'customer_service') OR
    public.has_job_type(_user_id, 'manager')
$$;

-- Update documentation
COMMENT ON FUNCTION public.has_company_full_access(uuid) IS 
'Returns true if user has full access WITHIN their company (company_admin, customer_service, or manager). Does NOT grant cross-company access.';