-- Complete rename of has_full_access to has_company_full_access
-- All in one transaction

-- 1. Create the new clearly-named function
CREATE OR REPLACE FUNCTION public.has_company_full_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    public.has_role(_user_id, 'company_admin'::public.app_role) OR
    public.has_job_type(_user_id, 'customer_service')
$$;

-- 2. Update has_dispatch_access to use new function
CREATE OR REPLACE FUNCTION public.has_dispatch_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    public.has_role(_user_id, 'platform_admin'::public.app_role) OR
    public.has_company_full_access(_user_id) OR
    public.has_job_type(_user_id, 'dispatch')
$$;

-- 3. Update has_billing_access
CREATE OR REPLACE FUNCTION public.has_billing_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    public.has_role(_user_id, 'platform_admin'::public.app_role) OR
    public.has_company_full_access(_user_id) OR
    public.has_job_type(_user_id, 'billing')
$$;

-- 4. Update has_marketing_access
CREATE OR REPLACE FUNCTION public.has_marketing_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    public.has_role(_user_id, 'platform_admin'::public.app_role) OR
    public.has_company_full_access(_user_id) OR
    public.has_job_type(_user_id, 'marketing')
$$;

-- 5. Update has_inventory_access
CREATE OR REPLACE FUNCTION public.has_inventory_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    public.has_role(_user_id, 'platform_admin'::public.app_role) OR
    public.has_company_full_access(_user_id) OR
    public.has_job_type(_user_id, 'inventory') OR
    public.has_job_type(_user_id, 'dispatch')
$$;

-- 6. Update the policy that uses has_full_access directly
DROP POLICY IF EXISTS "customer_feedback_full_access" ON public.customer_feedback;

CREATE POLICY "customer_feedback_company_access" ON public.customer_feedback
FOR ALL TO authenticated
USING (
  public.get_user_company_id(auth.uid()) = company_id AND
  (public.has_company_full_access(auth.uid()) OR public.has_marketing_access(auth.uid()))
)
WITH CHECK (
  public.get_user_company_id(auth.uid()) = company_id AND
  (public.has_company_full_access(auth.uid()) OR public.has_marketing_access(auth.uid()))
);

-- 7. Now drop the old function
DROP FUNCTION IF EXISTS public.has_full_access(uuid);

-- 8. Add documentation
COMMENT ON FUNCTION public.has_company_full_access(uuid) IS 
'Returns true if user has full access WITHIN their company (company_admin or customer_service). Does NOT grant cross-company access.';