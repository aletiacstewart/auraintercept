
-- ============================================================
-- PRE-LAUNCH SECURITY HARDENING MIGRATION (CORRECTED)
-- Fixes all security scan findings and hardens RLS policies
-- ============================================================

-- 1. REVOKE ANON ACCESS FROM ALL SENSITIVE TABLES
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.appointments FROM anon;
REVOKE ALL ON public.customer_profiles FROM anon;
REVOKE ALL ON public.customers FROM anon;
REVOKE ALL ON public.invoices FROM anon;
REVOKE ALL ON public.quotes FROM anon;
REVOKE ALL ON public.warranty_records FROM anon;
REVOKE ALL ON public.leads FROM anon;
REVOKE ALL ON public.tenant_integrations FROM anon;
REVOKE ALL ON public.google_calendar_connections FROM anon;
REVOKE ALL ON public.social_accounts FROM anon;
REVOKE ALL ON public.crm_connections FROM anon;
REVOKE ALL ON public.call_logs FROM anon;
REVOKE ALL ON public.job_assignments FROM anon;
REVOKE ALL ON public.winback_offers FROM anon;
REVOKE ALL ON public.customer_referrals FROM anon;
REVOKE ALL ON public.marketing_campaigns FROM anon;
REVOKE ALL ON public.inventory_items FROM anon;
REVOKE ALL ON public.ai_agent_logs FROM anon;
REVOKE ALL ON public.ai_agent_context FROM anon;
REVOKE ALL ON public.ai_agent_configs FROM anon;
REVOKE ALL ON public.ai_agent_events FROM anon;
REVOKE ALL ON public.crm_entity_mappings FROM anon;
REVOKE ALL ON public.crm_field_mappings FROM anon;
REVOKE ALL ON public.crm_sync_logs FROM anon;
REVOKE ALL ON public.calendar_event_mappings FROM anon;
REVOKE ALL ON public.calendar_sync_jobs FROM anon;

-- 2. FIX POLICIES USING 'public' ROLE - DROP DUPLICATES FIRST

-- Fix marketing_campaigns - drop BOTH old policies
DROP POLICY IF EXISTS "Platform admins can manage all marketing campaigns" ON public.marketing_campaigns;
DROP POLICY IF EXISTS "marketing_campaigns_platform_admin" ON public.marketing_campaigns;

CREATE POLICY "marketing_campaigns_platform_full" ON public.marketing_campaigns 
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'platform_admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'platform_admin'::public.app_role));

-- Fix social_accounts policies - convert from public to authenticated role
DROP POLICY IF EXISTS "Company admins can delete social accounts" ON public.social_accounts;
DROP POLICY IF EXISTS "Company admins can insert social accounts" ON public.social_accounts;
DROP POLICY IF EXISTS "Company admins can update social accounts" ON public.social_accounts;
DROP POLICY IF EXISTS "Company members can view social accounts" ON public.social_accounts;

CREATE POLICY "social_accounts_admin_manage" ON public.social_accounts 
FOR ALL TO authenticated
USING (
  public.get_user_company_id(auth.uid()) = company_id 
  AND public.has_company_full_access(auth.uid())
)
WITH CHECK (
  public.get_user_company_id(auth.uid()) = company_id 
  AND public.has_company_full_access(auth.uid())
);

CREATE POLICY "social_accounts_marketing_read" ON public.social_accounts 
FOR SELECT TO authenticated
USING (
  public.get_user_company_id(auth.uid()) = company_id 
  AND public.has_marketing_access(auth.uid())
);

CREATE POLICY "social_accounts_platform_read" ON public.social_accounts 
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'platform_admin'::public.app_role));

-- 3. HARDEN PROFILES TABLE - Restrict sensitive employee data
DROP POLICY IF EXISTS "profiles_company_view" ON public.profiles;

-- More restrictive - only dispatch/admin can see all company profiles
CREATE POLICY "profiles_company_admin_dispatch_view" ON public.profiles 
FOR SELECT TO authenticated
USING (
  public.get_user_company_id(auth.uid()) = company_id 
  AND (
    public.has_company_full_access(auth.uid()) 
    OR public.has_dispatch_access(auth.uid())
  )
);

-- 4. ADD EXPLICIT COMPANY_ID CHECKS TO JOB_ASSIGNMENTS
DROP POLICY IF EXISTS "job_assignments_technician_access" ON public.job_assignments;

CREATE POLICY "job_assignments_company_scoped" ON public.job_assignments 
FOR ALL TO authenticated
USING (
  public.get_user_company_id(auth.uid()) = company_id 
  AND (
    employee_id = auth.uid() 
    OR public.has_dispatch_access(auth.uid())
  )
)
WITH CHECK (
  public.get_user_company_id(auth.uid()) = company_id 
  AND public.has_dispatch_access(auth.uid())
);

-- 5. ADD SECURITY DOCUMENTATION COMMENTS
COMMENT ON TABLE public.tenant_integrations IS 'SECURITY: Contains API keys - admin-only access, no anon';
COMMENT ON TABLE public.google_calendar_connections IS 'SECURITY: Contains OAuth tokens - admin-only access, no anon';
COMMENT ON TABLE public.social_accounts IS 'SECURITY: Contains social OAuth tokens - admin/marketing access only';
COMMENT ON TABLE public.crm_connections IS 'SECURITY: Contains CRM OAuth tokens - admin-only access';
COMMENT ON TABLE public.profiles IS 'SECURITY: Contains employee PII - self/admin/dispatch access only';
COMMENT ON TABLE public.customer_profiles IS 'SECURITY: Contains customer PII - company access only, no anon';
COMMENT ON TABLE public.call_logs IS 'SECURITY: Contains call recordings/transcripts - dispatch access only';
