-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Company admins can manage reminder settings" ON public.reminder_settings;

-- Create separate policies for INSERT, UPDATE, DELETE with proper WITH CHECK
CREATE POLICY "Company admins can insert reminder settings"
ON public.reminder_settings
FOR INSERT
WITH CHECK (
  company_id = get_user_company_id(auth.uid()) 
  AND (
    has_role(auth.uid(), 'company_admin'::app_role)
    OR has_role(auth.uid(), 'platform_admin'::app_role)
    OR has_company_full_access(auth.uid())
  )
);

CREATE POLICY "Company admins can update reminder settings"
ON public.reminder_settings
FOR UPDATE
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND (
    has_role(auth.uid(), 'company_admin'::app_role)
    OR has_role(auth.uid(), 'platform_admin'::app_role)
    OR has_company_full_access(auth.uid())
  )
)
WITH CHECK (
  company_id = get_user_company_id(auth.uid()) 
  AND (
    has_role(auth.uid(), 'company_admin'::app_role)
    OR has_role(auth.uid(), 'platform_admin'::app_role)
    OR has_company_full_access(auth.uid())
  )
);

CREATE POLICY "Company admins can delete reminder settings"
ON public.reminder_settings
FOR DELETE
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND (
    has_role(auth.uid(), 'company_admin'::app_role)
    OR has_role(auth.uid(), 'platform_admin'::app_role)
    OR has_company_full_access(auth.uid())
  )
);