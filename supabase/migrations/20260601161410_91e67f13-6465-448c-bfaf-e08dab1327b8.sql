-- 1. company_integrations: restrict writes to full-access users
DROP POLICY IF EXISTS ci_company_write ON public.company_integrations;
CREATE POLICY ci_company_write ON public.company_integrations
  FOR ALL TO authenticated
  USING (company_id = get_user_company_id(auth.uid()) AND has_company_full_access(auth.uid()))
  WITH CHECK (company_id = get_user_company_id(auth.uid()) AND has_company_full_access(auth.uid()));

-- 2. employee_registration_codes: drop overly permissive UPDATE policies; require email match
DROP POLICY IF EXISTS authenticated_users_can_use_codes ON public.employee_registration_codes;
DROP POLICY IF EXISTS "Authenticated users can mark code as used during registration" ON public.employee_registration_codes;
CREATE POLICY "Users can mark own registration code as used"
  ON public.employee_registration_codes
  FOR UPDATE TO authenticated
  USING (
    used = false
    AND expires_at > now()
    AND lower(email) = lower((auth.jwt() ->> 'email'))
  )
  WITH CHECK (
    used = true
    AND lower(email) = lower((auth.jwt() ->> 'email'))
  );

-- 3. social_accounts: revoke OAuth token columns from client-side roles
REVOKE SELECT (access_token, refresh_token) ON public.social_accounts FROM authenticated;
REVOKE SELECT (access_token, refresh_token) ON public.social_accounts FROM anon;