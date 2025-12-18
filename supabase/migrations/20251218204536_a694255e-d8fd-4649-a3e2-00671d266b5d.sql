-- Drop and recreate the company admin policy with proper WITH CHECK clause
DROP POLICY IF EXISTS "Company admins can manage employee job assignments" ON public.employee_job_assignments;

CREATE POLICY "Company admins can manage employee job assignments"
ON public.employee_job_assignments
FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND has_role(auth.uid(), 'company_admin'::app_role)
)
WITH CHECK (
  company_id = get_user_company_id(auth.uid()) 
  AND has_role(auth.uid(), 'company_admin'::app_role)
);