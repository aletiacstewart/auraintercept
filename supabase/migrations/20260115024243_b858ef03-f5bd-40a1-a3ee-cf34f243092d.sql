-- =============================================================================
-- AGGRESSIVE SECURITY FIX: Drop ALL existing policies and recreate strict ones
-- This ensures no legacy permissive policies remain
-- =============================================================================

-- ============== APPOINTMENTS ==============
DO $$ 
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'appointments'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.appointments', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.appointments FROM anon;
REVOKE ALL ON public.appointments FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;

CREATE POLICY "appointments_company_access" ON public.appointments FOR ALL TO authenticated
  USING (public.get_user_company_id(auth.uid()) = company_id)
  WITH CHECK (public.get_user_company_id(auth.uid()) = company_id);

CREATE POLICY "appointments_platform_admin_view" ON public.appointments FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'platform_admin'::public.app_role));

-- ============== WARRANTY_RECORDS ==============
DO $$ 
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'warranty_records'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.warranty_records', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.warranty_records ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.warranty_records FROM anon;
REVOKE ALL ON public.warranty_records FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.warranty_records TO authenticated;

CREATE POLICY "warranty_records_company_access" ON public.warranty_records FOR ALL TO authenticated
  USING (public.get_user_company_id(auth.uid()) = company_id)
  WITH CHECK (public.get_user_company_id(auth.uid()) = company_id);

-- ============== INVOICES ==============
DO $$ 
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'invoices'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.invoices', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.invoices FROM anon;
REVOKE ALL ON public.invoices FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO authenticated;

CREATE POLICY "invoices_company_access" ON public.invoices FOR ALL TO authenticated
  USING (public.get_user_company_id(auth.uid()) = company_id)
  WITH CHECK (public.get_user_company_id(auth.uid()) = company_id);

-- ============== QUOTES ==============
DO $$ 
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'quotes'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.quotes', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.quotes FROM anon;
REVOKE ALL ON public.quotes FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quotes TO authenticated;

CREATE POLICY "quotes_company_access" ON public.quotes FOR ALL TO authenticated
  USING (public.get_user_company_id(auth.uid()) = company_id)
  WITH CHECK (public.get_user_company_id(auth.uid()) = company_id);

-- ============== WINBACK_OFFERS ==============
DO $$ 
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'winback_offers'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.winback_offers', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.winback_offers ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.winback_offers FROM anon;
REVOKE ALL ON public.winback_offers FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.winback_offers TO authenticated;

CREATE POLICY "winback_offers_company_access" ON public.winback_offers FOR ALL TO authenticated
  USING (public.get_user_company_id(auth.uid()) = company_id)
  WITH CHECK (public.get_user_company_id(auth.uid()) = company_id);

-- ============== LEADS ==============
DO $$ 
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'leads'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.leads', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.leads FROM anon;
REVOKE ALL ON public.leads FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;

CREATE POLICY "leads_company_access" ON public.leads FOR ALL TO authenticated
  USING (public.get_user_company_id(auth.uid()) = company_id)
  WITH CHECK (public.get_user_company_id(auth.uid()) = company_id);

-- ============== CUSTOMER_REFERRALS ==============
DO $$ 
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'customer_referrals'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.customer_referrals', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.customer_referrals ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.customer_referrals FROM anon;
REVOKE ALL ON public.customer_referrals FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_referrals TO authenticated;

CREATE POLICY "customer_referrals_company_access" ON public.customer_referrals FOR ALL TO authenticated
  USING (public.get_user_company_id(auth.uid()) = company_id)
  WITH CHECK (public.get_user_company_id(auth.uid()) = company_id);

-- ============== CALL_LOGS ==============
DO $$ 
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'call_logs'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.call_logs', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.call_logs FROM anon;
REVOKE ALL ON public.call_logs FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.call_logs TO authenticated;

CREATE POLICY "call_logs_company_access" ON public.call_logs FOR ALL TO authenticated
  USING (public.get_user_company_id(auth.uid()) = company_id)
  WITH CHECK (public.get_user_company_id(auth.uid()) = company_id);

-- ============== CUSTOMER_PROFILES ==============
DO $$ 
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'customer_profiles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.customer_profiles', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.customer_profiles FROM anon;
REVOKE ALL ON public.customer_profiles FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_profiles TO authenticated;

CREATE POLICY "customer_profiles_company_access" ON public.customer_profiles FOR ALL TO authenticated
  USING (public.get_user_company_id(auth.uid()) = company_id)
  WITH CHECK (public.get_user_company_id(auth.uid()) = company_id);

-- ============== CUSTOMERS ==============
DO $$ 
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'customers'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.customers', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.customers FROM anon;
REVOKE ALL ON public.customers FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;

CREATE POLICY "customers_company_access" ON public.customers FOR ALL TO authenticated
  USING (public.get_user_company_id(auth.uid()) = company_id)
  WITH CHECK (public.get_user_company_id(auth.uid()) = company_id);

-- ============== JOB_ASSIGNMENTS ==============
DO $$ 
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'job_assignments'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.job_assignments', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.job_assignments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.job_assignments FROM anon;
REVOKE ALL ON public.job_assignments FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_assignments TO authenticated;

CREATE POLICY "job_assignments_company_access" ON public.job_assignments FOR ALL TO authenticated
  USING (public.get_user_company_id(auth.uid()) = company_id)
  WITH CHECK (public.get_user_company_id(auth.uid()) = company_id);

-- ============== CAMPAIGN_RECIPIENTS ==============
DO $$ 
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'campaign_recipients'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.campaign_recipients', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.campaign_recipients ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.campaign_recipients FROM anon;
REVOKE ALL ON public.campaign_recipients FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_recipients TO authenticated;

CREATE POLICY "campaign_recipients_company_access" ON public.campaign_recipients FOR ALL TO authenticated
  USING (public.get_user_company_id(auth.uid()) = company_id)
  WITH CHECK (public.get_user_company_id(auth.uid()) = company_id);

-- ============== CUSTOMER_FEEDBACK ==============
DO $$ 
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'customer_feedback'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.customer_feedback', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.customer_feedback ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.customer_feedback FROM anon;
REVOKE ALL ON public.customer_feedback FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_feedback TO authenticated;

CREATE POLICY "customer_feedback_company_access" ON public.customer_feedback FOR ALL TO authenticated
  USING (public.get_user_company_id(auth.uid()) = company_id)
  WITH CHECK (public.get_user_company_id(auth.uid()) = company_id);

-- ============== PROFILES (Employee data) ==============
DO $$ 
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.profiles FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;

-- Users can view/update their own profile
CREATE POLICY "profiles_own_access" ON public.profiles FOR ALL TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Company members can view profiles in their company
CREATE POLICY "profiles_company_view" ON public.profiles FOR SELECT TO authenticated
  USING (public.get_user_company_id(auth.uid()) = company_id);

-- Platform admins can view all
CREATE POLICY "profiles_platform_admin" ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'platform_admin'::public.app_role));

-- ============== COMPANIES ==============
DO $$ 
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'companies'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.companies', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.companies FROM anon;
REVOKE ALL ON public.companies FROM authenticated;
GRANT SELECT, UPDATE ON public.companies TO authenticated;

-- Company members can view their company
CREATE POLICY "companies_member_view" ON public.companies FOR SELECT TO authenticated
  USING (public.get_user_company_id(auth.uid()) = id);

-- Company admins can update their company
CREATE POLICY "companies_admin_update" ON public.companies FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'company_admin'::public.app_role) AND public.get_user_company_id(auth.uid()) = id)
  WITH CHECK (public.has_role(auth.uid(), 'company_admin'::public.app_role) AND public.get_user_company_id(auth.uid()) = id);

-- Platform admins can manage all
CREATE POLICY "companies_platform_admin" ON public.companies FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'platform_admin'::public.app_role));

-- ============== TENANT_INTEGRATIONS (API Keys - CRITICAL!) ==============
DO $$ 
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tenant_integrations'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.tenant_integrations', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.tenant_integrations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.tenant_integrations FROM anon;
REVOKE ALL ON public.tenant_integrations FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_integrations TO authenticated;

-- Only company admins can access their integrations
CREATE POLICY "tenant_integrations_admin_only" ON public.tenant_integrations FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'company_admin'::public.app_role) 
    AND public.get_user_company_id(auth.uid()) = company_id
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'company_admin'::public.app_role) 
    AND public.get_user_company_id(auth.uid()) = company_id
  );

-- Platform admins can view
CREATE POLICY "tenant_integrations_platform_view" ON public.tenant_integrations FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'platform_admin'::public.app_role));

-- ============== CRM_CONNECTIONS (OAuth tokens - CRITICAL!) ==============
DO $$ 
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'crm_connections'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.crm_connections', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.crm_connections ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.crm_connections FROM anon;
REVOKE ALL ON public.crm_connections FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_connections TO authenticated;

CREATE POLICY "crm_connections_admin_only" ON public.crm_connections FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'company_admin'::public.app_role) 
    AND public.get_user_company_id(auth.uid()) = company_id
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'company_admin'::public.app_role) 
    AND public.get_user_company_id(auth.uid()) = company_id
  );

-- ============== GOOGLE_CALENDAR_CONNECTIONS (OAuth tokens - CRITICAL!) ==============
DO $$ 
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'google_calendar_connections'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.google_calendar_connections', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.google_calendar_connections ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.google_calendar_connections FROM anon;
REVOKE ALL ON public.google_calendar_connections FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.google_calendar_connections TO authenticated;

CREATE POLICY "google_calendar_connections_admin_only" ON public.google_calendar_connections FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'company_admin'::public.app_role) 
    AND public.get_user_company_id(auth.uid()) = company_id
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'company_admin'::public.app_role) 
    AND public.get_user_company_id(auth.uid()) = company_id
  );

-- ============== SUPPRESSED_EMAILS ==============
DO $$ 
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'suppressed_emails'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.suppressed_emails', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.suppressed_emails ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.suppressed_emails FROM anon;
REVOKE ALL ON public.suppressed_emails FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.suppressed_emails TO authenticated;

CREATE POLICY "suppressed_emails_company_access" ON public.suppressed_emails FOR ALL TO authenticated
  USING (public.get_user_company_id(auth.uid()) = company_id)
  WITH CHECK (public.get_user_company_id(auth.uid()) = company_id);

-- ============== REMINDER_LOGS ==============
DO $$ 
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'reminder_logs'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.reminder_logs', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.reminder_logs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.reminder_logs FROM anon;
REVOKE ALL ON public.reminder_logs FROM authenticated;
GRANT SELECT ON public.reminder_logs TO authenticated;

CREATE POLICY "reminder_logs_company_view" ON public.reminder_logs FOR SELECT TO authenticated
  USING (public.get_user_company_id(auth.uid()) = company_id);

-- ============== MISSED_CALL_CALLBACKS ==============
DO $$ 
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'missed_call_callbacks'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.missed_call_callbacks', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.missed_call_callbacks ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.missed_call_callbacks FROM anon;
REVOKE ALL ON public.missed_call_callbacks FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.missed_call_callbacks TO authenticated;

CREATE POLICY "missed_call_callbacks_company_access" ON public.missed_call_callbacks FOR ALL TO authenticated
  USING (public.get_user_company_id(auth.uid()) = company_id)
  WITH CHECK (public.get_user_company_id(auth.uid()) = company_id);

-- ============== AI_AGENT_CONTEXT ==============
DO $$ 
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'ai_agent_context'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.ai_agent_context', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.ai_agent_context ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ai_agent_context FROM anon;
REVOKE ALL ON public.ai_agent_context FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_agent_context TO authenticated;

CREATE POLICY "ai_agent_context_company_access" ON public.ai_agent_context FOR ALL TO authenticated
  USING (public.get_user_company_id(auth.uid()) = company_id)
  WITH CHECK (public.get_user_company_id(auth.uid()) = company_id);

-- ============== INVENTORY_ITEMS ==============
DO $$ 
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'inventory_items'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.inventory_items', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.inventory_items FROM anon;
REVOKE ALL ON public.inventory_items FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_items TO authenticated;

CREATE POLICY "inventory_items_company_access" ON public.inventory_items FOR ALL TO authenticated
  USING (public.get_user_company_id(auth.uid()) = company_id)
  WITH CHECK (public.get_user_company_id(auth.uid()) = company_id);

-- ============== MARKETING_CAMPAIGNS ==============
DO $$ 
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'marketing_campaigns'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.marketing_campaigns', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.marketing_campaigns FROM anon;
REVOKE ALL ON public.marketing_campaigns FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_campaigns TO authenticated;

CREATE POLICY "marketing_campaigns_company_access" ON public.marketing_campaigns FOR ALL TO authenticated
  USING (public.get_user_company_id(auth.uid()) = company_id)
  WITH CHECK (public.get_user_company_id(auth.uid()) = company_id);