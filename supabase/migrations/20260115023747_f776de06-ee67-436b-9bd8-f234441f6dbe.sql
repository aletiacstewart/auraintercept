-- =============================================================================
-- CRITICAL SECURITY FIX: Lock down all tables with public PII exposure
-- This migration removes all public access and enforces tenant-based RLS
-- =============================================================================

-- ============== 1. APPOINTMENTS ==============
-- Remove overly permissive public policies
DROP POLICY IF EXISTS "Anyone can view appointment by token" ON public.appointments;
DROP POLICY IF EXISTS "Token access with time and status restrictions" ON public.appointments;
DROP POLICY IF EXISTS "Public can read appointments" ON public.appointments;
DROP POLICY IF EXISTS "Anyone can view appointments" ON public.appointments;

-- Ensure RLS is enabled
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Revoke anon access completely
REVOKE ALL ON public.appointments FROM anon;

-- Ensure proper authenticated policies exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'appointments' AND policyname = 'Company members view own appointments') THEN
    CREATE POLICY "Company members view own appointments" ON public.appointments
    FOR SELECT USING (public.get_user_company_id(auth.uid()) = company_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'appointments' AND policyname = 'Company members manage own appointments') THEN
    CREATE POLICY "Company members manage own appointments" ON public.appointments
    FOR ALL USING (public.get_user_company_id(auth.uid()) = company_id)
    WITH CHECK (public.get_user_company_id(auth.uid()) = company_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'appointments' AND policyname = 'Platform admins view all appointments') THEN
    CREATE POLICY "Platform admins view all appointments" ON public.appointments
    FOR SELECT USING (public.has_role(auth.uid(), 'platform_admin'::public.app_role));
  END IF;
END $$;

-- ============== 2. CUSTOMERS ==============
DROP POLICY IF EXISTS "Anyone can view customers" ON public.customers;
DROP POLICY IF EXISTS "Public can read customers" ON public.customers;

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.customers FROM anon;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customers' AND policyname = 'Company members manage own customers') THEN
    CREATE POLICY "Company members manage own customers" ON public.customers
    FOR ALL USING (public.get_user_company_id(auth.uid()) = company_id)
    WITH CHECK (public.get_user_company_id(auth.uid()) = company_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customers' AND policyname = 'Platform admins view all customers') THEN
    CREATE POLICY "Platform admins view all customers" ON public.customers
    FOR SELECT USING (public.has_role(auth.uid(), 'platform_admin'::public.app_role));
  END IF;
END $$;

-- ============== 3. LEADS ==============
DROP POLICY IF EXISTS "Anyone can view leads" ON public.leads;
DROP POLICY IF EXISTS "Public can read leads" ON public.leads;

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.leads FROM anon;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leads' AND policyname = 'Company members manage own leads') THEN
    CREATE POLICY "Company members manage own leads" ON public.leads
    FOR ALL USING (public.get_user_company_id(auth.uid()) = company_id)
    WITH CHECK (public.get_user_company_id(auth.uid()) = company_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leads' AND policyname = 'Platform admins view all leads') THEN
    CREATE POLICY "Platform admins view all leads" ON public.leads
    FOR SELECT USING (public.has_role(auth.uid(), 'platform_admin'::public.app_role));
  END IF;
END $$;

-- ============== 4. INVOICES ==============
DROP POLICY IF EXISTS "Anyone can view invoices" ON public.invoices;
DROP POLICY IF EXISTS "Public can read invoices" ON public.invoices;

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.invoices FROM anon;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'invoices' AND policyname = 'Company members manage own invoices') THEN
    CREATE POLICY "Company members manage own invoices" ON public.invoices
    FOR ALL USING (public.get_user_company_id(auth.uid()) = company_id)
    WITH CHECK (public.get_user_company_id(auth.uid()) = company_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'invoices' AND policyname = 'Platform admins view all invoices') THEN
    CREATE POLICY "Platform admins view all invoices" ON public.invoices
    FOR SELECT USING (public.has_role(auth.uid(), 'platform_admin'::public.app_role));
  END IF;
END $$;

-- ============== 5. QUOTES ==============
DROP POLICY IF EXISTS "Anyone can view quotes" ON public.quotes;
DROP POLICY IF EXISTS "Public can read quotes" ON public.quotes;

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.quotes FROM anon;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quotes' AND policyname = 'Company members manage own quotes') THEN
    CREATE POLICY "Company members manage own quotes" ON public.quotes
    FOR ALL USING (public.get_user_company_id(auth.uid()) = company_id)
    WITH CHECK (public.get_user_company_id(auth.uid()) = company_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quotes' AND policyname = 'Platform admins view all quotes') THEN
    CREATE POLICY "Platform admins view all quotes" ON public.quotes
    FOR SELECT USING (public.has_role(auth.uid(), 'platform_admin'::public.app_role));
  END IF;
END $$;

-- ============== 6. CUSTOMER_REFERRALS ==============
DROP POLICY IF EXISTS "Anyone can view customer_referrals" ON public.customer_referrals;
DROP POLICY IF EXISTS "Public can read customer_referrals" ON public.customer_referrals;

ALTER TABLE public.customer_referrals ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.customer_referrals FROM anon;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customer_referrals' AND policyname = 'Company members manage own referrals') THEN
    CREATE POLICY "Company members manage own referrals" ON public.customer_referrals
    FOR ALL USING (public.get_user_company_id(auth.uid()) = company_id)
    WITH CHECK (public.get_user_company_id(auth.uid()) = company_id);
  END IF;
END $$;

-- ============== 7. WINBACK_OFFERS ==============
DROP POLICY IF EXISTS "Anyone can view winback_offers" ON public.winback_offers;
DROP POLICY IF EXISTS "Public can read winback_offers" ON public.winback_offers;

ALTER TABLE public.winback_offers ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.winback_offers FROM anon;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'winback_offers' AND policyname = 'Company members manage own winback offers') THEN
    CREATE POLICY "Company members manage own winback offers" ON public.winback_offers
    FOR ALL USING (public.get_user_company_id(auth.uid()) = company_id)
    WITH CHECK (public.get_user_company_id(auth.uid()) = company_id);
  END IF;
END $$;

-- ============== 8. CUSTOMER_FEEDBACK ==============
DROP POLICY IF EXISTS "Anyone can view customer_feedback" ON public.customer_feedback;
DROP POLICY IF EXISTS "Public can read customer_feedback" ON public.customer_feedback;

ALTER TABLE public.customer_feedback ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.customer_feedback FROM anon;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customer_feedback' AND policyname = 'Company members manage own feedback') THEN
    CREATE POLICY "Company members manage own feedback" ON public.customer_feedback
    FOR ALL USING (public.get_user_company_id(auth.uid()) = company_id)
    WITH CHECK (public.get_user_company_id(auth.uid()) = company_id);
  END IF;
END $$;

-- ============== 9. CALL_LOGS ==============
DROP POLICY IF EXISTS "Anyone can view call_logs" ON public.call_logs;
DROP POLICY IF EXISTS "Public can read call_logs" ON public.call_logs;

ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.call_logs FROM anon;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'call_logs' AND policyname = 'Company members manage own call logs') THEN
    CREATE POLICY "Company members manage own call logs" ON public.call_logs
    FOR ALL USING (public.get_user_company_id(auth.uid()) = company_id)
    WITH CHECK (public.get_user_company_id(auth.uid()) = company_id);
  END IF;
END $$;

-- ============== 10. JOB_ASSIGNMENTS ==============
DROP POLICY IF EXISTS "Anyone can view job_assignments" ON public.job_assignments;
DROP POLICY IF EXISTS "Public can read job_assignments" ON public.job_assignments;

ALTER TABLE public.job_assignments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.job_assignments FROM anon;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'job_assignments' AND policyname = 'Company members manage own job assignments') THEN
    CREATE POLICY "Company members manage own job assignments" ON public.job_assignments
    FOR ALL USING (public.get_user_company_id(auth.uid()) = company_id)
    WITH CHECK (public.get_user_company_id(auth.uid()) = company_id);
  END IF;
END $$;

-- ============== 11. CAMPAIGN_RECIPIENTS ==============
DROP POLICY IF EXISTS "Anyone can view campaign_recipients" ON public.campaign_recipients;
DROP POLICY IF EXISTS "Public can read campaign_recipients" ON public.campaign_recipients;

ALTER TABLE public.campaign_recipients ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.campaign_recipients FROM anon;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'campaign_recipients' AND policyname = 'Company members manage own campaign recipients') THEN
    CREATE POLICY "Company members manage own campaign recipients" ON public.campaign_recipients
    FOR ALL USING (public.get_user_company_id(auth.uid()) = company_id)
    WITH CHECK (public.get_user_company_id(auth.uid()) = company_id);
  END IF;
END $$;

-- ============== 12. PROFILES (Employee data) ==============
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public can read profiles" ON public.profiles;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.profiles FROM anon;

DO $$
BEGIN
  -- Users can view their own profile
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users view own profile') THEN
    CREATE POLICY "Users view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);
  END IF;
  
  -- Users can update their own profile
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users update own profile') THEN
    CREATE POLICY "Users update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
  END IF;
  
  -- Company members can view profiles in their company
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Company members view company profiles') THEN
    CREATE POLICY "Company members view company profiles" ON public.profiles
    FOR SELECT USING (public.get_user_company_id(auth.uid()) = company_id);
  END IF;
  
  -- Company admins can manage profiles in their company
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Company admins manage company profiles') THEN
    CREATE POLICY "Company admins manage company profiles" ON public.profiles
    FOR ALL USING (
      public.has_role(auth.uid(), 'company_admin'::public.app_role)
      AND public.get_user_company_id(auth.uid()) = company_id
    ) WITH CHECK (
      public.has_role(auth.uid(), 'company_admin'::public.app_role)
      AND public.get_user_company_id(auth.uid()) = company_id
    );
  END IF;
  
  -- Platform admins can view all profiles
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Platform admins view all profiles') THEN
    CREATE POLICY "Platform admins view all profiles" ON public.profiles
    FOR SELECT USING (public.has_role(auth.uid(), 'platform_admin'::public.app_role));
  END IF;
END $$;

-- ============== 13. CUSTOMER_PROFILES ==============
DROP POLICY IF EXISTS "Anyone can view customer_profiles" ON public.customer_profiles;
DROP POLICY IF EXISTS "Public can read customer_profiles" ON public.customer_profiles;

ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.customer_profiles FROM anon;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customer_profiles' AND policyname = 'Company members manage own customer profiles') THEN
    CREATE POLICY "Company members manage own customer profiles" ON public.customer_profiles
    FOR ALL USING (public.get_user_company_id(auth.uid()) = company_id)
    WITH CHECK (public.get_user_company_id(auth.uid()) = company_id);
  END IF;
END $$;

-- ============== 14. COMPANIES (Sensitive config) ==============
DROP POLICY IF EXISTS "Anyone can view companies" ON public.companies;
DROP POLICY IF EXISTS "Public can read companies" ON public.companies;

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.companies FROM anon;

DO $$
BEGIN
  -- Company members can view their own company
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'companies' AND policyname = 'Company members view own company') THEN
    CREATE POLICY "Company members view own company" ON public.companies
    FOR SELECT USING (public.get_user_company_id(auth.uid()) = id);
  END IF;
  
  -- Company admins can update their company
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'companies' AND policyname = 'Company admins manage own company') THEN
    CREATE POLICY "Company admins manage own company" ON public.companies
    FOR UPDATE USING (
      public.has_role(auth.uid(), 'company_admin'::public.app_role)
      AND public.get_user_company_id(auth.uid()) = id
    ) WITH CHECK (
      public.has_role(auth.uid(), 'company_admin'::public.app_role)
      AND public.get_user_company_id(auth.uid()) = id
    );
  END IF;
  
  -- Platform admins can view and manage all companies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'companies' AND policyname = 'Platform admins manage all companies') THEN
    CREATE POLICY "Platform admins manage all companies" ON public.companies
    FOR ALL USING (public.has_role(auth.uid(), 'platform_admin'::public.app_role));
  END IF;
END $$;

-- ============== 15. TENANT_INTEGRATIONS (API Keys!) ==============
DROP POLICY IF EXISTS "Anyone can view tenant_integrations" ON public.tenant_integrations;
DROP POLICY IF EXISTS "Public can read tenant_integrations" ON public.tenant_integrations;

ALTER TABLE public.tenant_integrations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.tenant_integrations FROM anon;
REVOKE ALL ON public.tenant_integrations FROM authenticated;

DO $$
BEGIN
  -- Only company admins can manage their integrations
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tenant_integrations' AND policyname = 'Company admins manage own integrations') THEN
    CREATE POLICY "Company admins manage own integrations" ON public.tenant_integrations
    FOR ALL USING (
      public.has_role(auth.uid(), 'company_admin'::public.app_role)
      AND public.get_user_company_id(auth.uid()) = company_id
    ) WITH CHECK (
      public.has_role(auth.uid(), 'company_admin'::public.app_role)
      AND public.get_user_company_id(auth.uid()) = company_id
    );
  END IF;
  
  -- Platform admins can view all integrations
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tenant_integrations' AND policyname = 'Platform admins view all integrations') THEN
    CREATE POLICY "Platform admins view all integrations" ON public.tenant_integrations
    FOR SELECT USING (public.has_role(auth.uid(), 'platform_admin'::public.app_role));
  END IF;
END $$;

-- ============== 16. CRM_CONNECTIONS (OAuth tokens!) ==============
DROP POLICY IF EXISTS "Anyone can view crm_connections" ON public.crm_connections;
DROP POLICY IF EXISTS "Public can read crm_connections" ON public.crm_connections;

ALTER TABLE public.crm_connections ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.crm_connections FROM anon;
REVOKE ALL ON public.crm_connections FROM authenticated;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'crm_connections' AND policyname = 'Company admins manage own CRM connections') THEN
    CREATE POLICY "Company admins manage own CRM connections" ON public.crm_connections
    FOR ALL USING (
      public.has_role(auth.uid(), 'company_admin'::public.app_role)
      AND public.get_user_company_id(auth.uid()) = company_id
    ) WITH CHECK (
      public.has_role(auth.uid(), 'company_admin'::public.app_role)
      AND public.get_user_company_id(auth.uid()) = company_id
    );
  END IF;
END $$;

-- ============== 17. GOOGLE_CALENDAR_CONNECTIONS (OAuth tokens!) ==============
DROP POLICY IF EXISTS "Anyone can view google_calendar_connections" ON public.google_calendar_connections;
DROP POLICY IF EXISTS "Public can read google_calendar_connections" ON public.google_calendar_connections;

ALTER TABLE public.google_calendar_connections ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.google_calendar_connections FROM anon;
REVOKE ALL ON public.google_calendar_connections FROM authenticated;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'google_calendar_connections' AND policyname = 'Company admins manage own calendar connections') THEN
    CREATE POLICY "Company admins manage own calendar connections" ON public.google_calendar_connections
    FOR ALL USING (
      public.has_role(auth.uid(), 'company_admin'::public.app_role)
      AND public.get_user_company_id(auth.uid()) = company_id
    ) WITH CHECK (
      public.has_role(auth.uid(), 'company_admin'::public.app_role)
      AND public.get_user_company_id(auth.uid()) = company_id
    );
  END IF;
END $$;

-- ============== 18. WARRANTY_RECORDS (already fixed, just ensure) ==============
ALTER TABLE public.warranty_records ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.warranty_records FROM anon;

-- ============== 19. SUPPRESSED_EMAILS ==============
DROP POLICY IF EXISTS "Anyone can view suppressed_emails" ON public.suppressed_emails;
DROP POLICY IF EXISTS "Public can read suppressed_emails" ON public.suppressed_emails;

ALTER TABLE public.suppressed_emails ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.suppressed_emails FROM anon;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'suppressed_emails' AND policyname = 'Company admins manage own suppressed emails') THEN
    CREATE POLICY "Company admins manage own suppressed emails" ON public.suppressed_emails
    FOR ALL USING (
      public.has_role(auth.uid(), 'company_admin'::public.app_role)
      AND public.get_user_company_id(auth.uid()) = company_id
    ) WITH CHECK (
      public.has_role(auth.uid(), 'company_admin'::public.app_role)
      AND public.get_user_company_id(auth.uid()) = company_id
    );
  END IF;
END $$;

-- ============== 20. REMINDER_LOGS ==============
DROP POLICY IF EXISTS "Anyone can view reminder_logs" ON public.reminder_logs;
DROP POLICY IF EXISTS "Public can read reminder_logs" ON public.reminder_logs;

ALTER TABLE public.reminder_logs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.reminder_logs FROM anon;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reminder_logs' AND policyname = 'Company members view own reminder logs') THEN
    CREATE POLICY "Company members view own reminder logs" ON public.reminder_logs
    FOR SELECT USING (public.get_user_company_id(auth.uid()) = company_id);
  END IF;
END $$;

-- ============== 21. MISSED_CALL_CALLBACKS ==============
DROP POLICY IF EXISTS "Anyone can view missed_call_callbacks" ON public.missed_call_callbacks;
DROP POLICY IF EXISTS "Public can read missed_call_callbacks" ON public.missed_call_callbacks;

ALTER TABLE public.missed_call_callbacks ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.missed_call_callbacks FROM anon;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'missed_call_callbacks' AND policyname = 'Company members manage own missed callbacks') THEN
    CREATE POLICY "Company members manage own missed callbacks" ON public.missed_call_callbacks
    FOR ALL USING (public.get_user_company_id(auth.uid()) = company_id)
    WITH CHECK (public.get_user_company_id(auth.uid()) = company_id);
  END IF;
END $$;

-- ============== 22. AI_AGENT_CONTEXT ==============
DROP POLICY IF EXISTS "Anyone can view ai_agent_context" ON public.ai_agent_context;
DROP POLICY IF EXISTS "Public can read ai_agent_context" ON public.ai_agent_context;

ALTER TABLE public.ai_agent_context ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ai_agent_context FROM anon;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_agent_context' AND policyname = 'Company members manage own AI context') THEN
    CREATE POLICY "Company members manage own AI context" ON public.ai_agent_context
    FOR ALL USING (public.get_user_company_id(auth.uid()) = company_id)
    WITH CHECK (public.get_user_company_id(auth.uid()) = company_id);
  END IF;
END $$;

-- ============== 23. INVENTORY_ITEMS ==============
DROP POLICY IF EXISTS "Anyone can view inventory_items" ON public.inventory_items;
DROP POLICY IF EXISTS "Public can read inventory_items" ON public.inventory_items;

ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.inventory_items FROM anon;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'inventory_items' AND policyname = 'Company members manage own inventory') THEN
    CREATE POLICY "Company members manage own inventory" ON public.inventory_items
    FOR ALL USING (public.get_user_company_id(auth.uid()) = company_id)
    WITH CHECK (public.get_user_company_id(auth.uid()) = company_id);
  END IF;
END $$;

-- ============== 24. MARKETING_CAMPAIGNS ==============
DROP POLICY IF EXISTS "Anyone can view marketing_campaigns" ON public.marketing_campaigns;
DROP POLICY IF EXISTS "Public can read marketing_campaigns" ON public.marketing_campaigns;

ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.marketing_campaigns FROM anon;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'marketing_campaigns' AND policyname = 'Company members manage own campaigns') THEN
    CREATE POLICY "Company members manage own campaigns" ON public.marketing_campaigns
    FOR ALL USING (public.get_user_company_id(auth.uid()) = company_id)
    WITH CHECK (public.get_user_company_id(auth.uid()) = company_id);
  END IF;
END $$;

-- ============== 25. Create SECURITY DEFINER functions for public access patterns ==============

-- Function to get appointment by token (for customer-portal and calendar-feed)
CREATE OR REPLACE FUNCTION public.get_appointment_by_customer_token(p_token UUID)
RETURNS TABLE (
  id UUID,
  datetime TIMESTAMPTZ,
  duration_minutes INT,
  service_type TEXT,
  status TEXT,
  customer_name TEXT,
  customer_address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  company_id UUID,
  company_name TEXT,
  company_logo_url TEXT,
  company_primary_color TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.datetime,
    a.duration_minutes,
    a.service_type,
    a.status,
    a.customer_name,
    a.customer_address,
    a.notes,
    a.created_at,
    a.updated_at,
    a.company_id,
    c.name as company_name,
    c.logo_url as company_logo_url,
    c.primary_color as company_primary_color
  FROM public.appointments a
  JOIN public.companies c ON c.id = a.company_id
  WHERE a.customer_token = p_token
    AND a.datetime >= NOW() - INTERVAL '90 days'
    AND a.status IN ('scheduled', 'confirmed', 'completed');
END;
$$;

-- Function to get appointments for calendar feed by employee token
CREATE OR REPLACE FUNCTION public.get_employee_calendar_appointments(p_feed_token UUID)
RETURNS TABLE (
  id UUID,
  datetime TIMESTAMPTZ,
  duration_minutes INT,
  service_type TEXT,
  status TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  customer_address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_employee_id UUID;
BEGIN
  -- Find employee by feed token
  SELECT id INTO v_employee_id
  FROM public.profiles
  WHERE calendar_feed_token = p_feed_token;
  
  IF v_employee_id IS NULL THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    a.id,
    a.datetime,
    a.duration_minutes,
    a.service_type,
    a.status,
    a.customer_name,
    a.customer_phone,
    a.customer_email,
    a.customer_address,
    a.notes,
    a.created_at,
    a.updated_at
  FROM public.appointments a
  JOIN public.job_assignments ja ON ja.appointment_id = a.id
  WHERE ja.employee_id = v_employee_id
    AND ja.status != 'cancelled'
    AND a.status != 'cancelled'
    AND a.datetime >= NOW() - INTERVAL '30 days'
  ORDER BY a.datetime;
END;
$$;

-- Function to get appointments for calendar feed by company token
CREATE OR REPLACE FUNCTION public.get_company_calendar_appointments(p_feed_token UUID)
RETURNS TABLE (
  id UUID,
  datetime TIMESTAMPTZ,
  duration_minutes INT,
  service_type TEXT,
  status TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  customer_address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  company_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id UUID;
  v_company_name TEXT;
BEGIN
  -- Find company by feed token
  SELECT id, name INTO v_company_id, v_company_name
  FROM public.companies
  WHERE calendar_feed_token = p_feed_token;
  
  IF v_company_id IS NULL THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    a.id,
    a.datetime,
    a.duration_minutes,
    a.service_type,
    a.status,
    a.customer_name,
    a.customer_phone,
    a.customer_email,
    a.customer_address,
    a.notes,
    a.created_at,
    a.updated_at,
    v_company_name as company_name
  FROM public.appointments a
  WHERE a.company_id = v_company_id
    AND a.status != 'cancelled'
    AND a.datetime >= NOW() - INTERVAL '30 days'
  ORDER BY a.datetime;
END;
$$;

-- Grant execute to anon for these specific functions (used by edge functions with service role)
GRANT EXECUTE ON FUNCTION public.get_appointment_by_customer_token(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_employee_calendar_appointments(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_company_calendar_appointments(UUID) TO service_role;