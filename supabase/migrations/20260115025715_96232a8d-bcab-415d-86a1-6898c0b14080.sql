-- ============================================
-- ROLE-BASED ACCESS CONTROL SECURITY POLICIES
-- ============================================
-- Roles:
-- - Technician: Only jobs assigned to them, related quotes/invoices
-- - Customer Service: Everything (to help customers)
-- - Marketing/Sales: Marketing campaigns, leads, analytics
-- - Dispatch: Technician data, scheduling, job assignments
-- - Billing: Only billing data (invoices, quotes, payments)
-- - Admin (company_admin/platform_admin): Everything

-- ============================================
-- HELPER FUNCTIONS FOR JOB TYPE CHECKS
-- ============================================

-- Check if user has a specific employee job type
CREATE OR REPLACE FUNCTION public.has_job_type(_user_id uuid, _job_type text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.employee_job_assignments
    WHERE employee_id = _user_id
      AND job_type::text = _job_type
  )
$$;

-- Check if user is technician assigned to a specific job
CREATE OR REPLACE FUNCTION public.is_assigned_to_job(_user_id uuid, _appointment_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.job_assignments
    WHERE employee_id = _user_id
      AND appointment_id = _appointment_id
  )
$$;

-- Check if user has any of: customer_service, company_admin, or platform_admin (full access roles)
CREATE OR REPLACE FUNCTION public.has_full_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    public.has_role(_user_id, 'platform_admin'::public.app_role) OR
    public.has_role(_user_id, 'company_admin'::public.app_role) OR
    public.has_job_type(_user_id, 'customer_service')
$$;

-- Check if user has dispatch access (dispatch role, customer_service, or admin)
CREATE OR REPLACE FUNCTION public.has_dispatch_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    public.has_full_access(_user_id) OR
    public.has_job_type(_user_id, 'dispatch')
$$;

-- Check if user has billing access (billing role, customer_service, or admin)
CREATE OR REPLACE FUNCTION public.has_billing_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    public.has_full_access(_user_id) OR
    public.has_job_type(_user_id, 'billing')
$$;

-- Check if user has marketing access (marketing role, customer_service, or admin)
CREATE OR REPLACE FUNCTION public.has_marketing_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    public.has_full_access(_user_id) OR
    public.has_job_type(_user_id, 'marketing')
$$;

-- ============================================
-- DROP EXISTING POLICIES FOR ROLE-BASED TABLES
-- ============================================

-- Job Assignments
DROP POLICY IF EXISTS "job_assignments_company_access" ON public.job_assignments;
DROP POLICY IF EXISTS "job_assignments_platform_admin_view" ON public.job_assignments;

-- Appointments
DROP POLICY IF EXISTS "appointments_company_access" ON public.appointments;
DROP POLICY IF EXISTS "appointments_platform_admin_view" ON public.appointments;

-- Invoices
DROP POLICY IF EXISTS "invoices_company_access" ON public.invoices;
DROP POLICY IF EXISTS "invoices_platform_admin_view" ON public.invoices;

-- Quotes
DROP POLICY IF EXISTS "quotes_company_access" ON public.quotes;
DROP POLICY IF EXISTS "quotes_platform_admin_view" ON public.quotes;

-- Leads
DROP POLICY IF EXISTS "leads_company_access" ON public.leads;
DROP POLICY IF EXISTS "leads_platform_admin_view" ON public.leads;

-- Marketing Campaigns
DROP POLICY IF EXISTS "marketing_campaigns_company_access" ON public.marketing_campaigns;
DROP POLICY IF EXISTS "marketing_campaigns_platform_admin_view" ON public.marketing_campaigns;

-- Campaign Recipients
DROP POLICY IF EXISTS "campaign_recipients_company_access" ON public.campaign_recipients;
DROP POLICY IF EXISTS "campaign_recipients_platform_admin_view" ON public.campaign_recipients;

-- Customer Profiles
DROP POLICY IF EXISTS "customer_profiles_company_access" ON public.customer_profiles;
DROP POLICY IF EXISTS "customer_profiles_platform_admin_view" ON public.customer_profiles;

-- Customers
DROP POLICY IF EXISTS "customers_company_access" ON public.customers;
DROP POLICY IF EXISTS "customers_platform_admin_view" ON public.customers;

-- ============================================
-- JOB_ASSIGNMENTS POLICIES
-- Technicians: only their assigned jobs
-- Dispatch: all jobs in company
-- Admin/CustomerService: all jobs in company
-- ============================================

-- Technicians see only their assigned jobs
CREATE POLICY "job_assignments_technician_access" ON public.job_assignments
FOR ALL TO authenticated
USING (
  employee_id = auth.uid() OR
  public.has_dispatch_access(auth.uid())
)
WITH CHECK (
  public.has_dispatch_access(auth.uid())
);

-- Platform admin can view all
CREATE POLICY "job_assignments_platform_admin" ON public.job_assignments
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'platform_admin'::public.app_role));

-- ============================================
-- APPOINTMENTS POLICIES
-- Technicians: only appointments for their assigned jobs
-- Dispatch: all appointments in company
-- Admin/CustomerService: all appointments in company
-- ============================================

-- Full access roles see all in company
CREATE POLICY "appointments_full_access" ON public.appointments
FOR ALL TO authenticated
USING (
  public.get_user_company_id(auth.uid()) = company_id AND
  public.has_dispatch_access(auth.uid())
)
WITH CHECK (
  public.get_user_company_id(auth.uid()) = company_id AND
  public.has_dispatch_access(auth.uid())
);

-- Technicians see only their assigned appointments
CREATE POLICY "appointments_technician_access" ON public.appointments
FOR SELECT TO authenticated
USING (
  public.get_user_company_id(auth.uid()) = company_id AND
  public.has_job_type(auth.uid(), 'technician') AND
  public.is_assigned_to_job(auth.uid(), id)
);

-- Platform admin can view all
CREATE POLICY "appointments_platform_admin" ON public.appointments
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'platform_admin'::public.app_role));

-- ============================================
-- INVOICES POLICIES
-- Billing: all invoices in company
-- Technicians: only invoices for their assigned jobs or created by them
-- Admin/CustomerService: all invoices in company
-- ============================================

-- Billing and full access roles see all in company
CREATE POLICY "invoices_billing_access" ON public.invoices
FOR ALL TO authenticated
USING (
  public.get_user_company_id(auth.uid()) = company_id AND
  public.has_billing_access(auth.uid())
)
WITH CHECK (
  public.get_user_company_id(auth.uid()) = company_id AND
  public.has_billing_access(auth.uid())
);

-- Technicians see only invoices for their assigned jobs
CREATE POLICY "invoices_technician_access" ON public.invoices
FOR SELECT TO authenticated
USING (
  public.get_user_company_id(auth.uid()) = company_id AND
  public.has_job_type(auth.uid(), 'technician') AND
  (
    appointment_id IS NOT NULL AND 
    public.is_assigned_to_job(auth.uid(), appointment_id)
  )
);

-- Platform admin can view all
CREATE POLICY "invoices_platform_admin" ON public.invoices
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'platform_admin'::public.app_role));

-- ============================================
-- QUOTES POLICIES
-- Billing: all quotes in company
-- Technicians: only quotes for their assigned jobs or created by them
-- Admin/CustomerService: all quotes in company
-- ============================================

-- Billing and full access roles see all in company
CREATE POLICY "quotes_billing_access" ON public.quotes
FOR ALL TO authenticated
USING (
  public.get_user_company_id(auth.uid()) = company_id AND
  public.has_billing_access(auth.uid())
)
WITH CHECK (
  public.get_user_company_id(auth.uid()) = company_id AND
  public.has_billing_access(auth.uid())
);

-- Technicians see only quotes for their assigned jobs
CREATE POLICY "quotes_technician_access" ON public.quotes
FOR SELECT TO authenticated
USING (
  public.get_user_company_id(auth.uid()) = company_id AND
  public.has_job_type(auth.uid(), 'technician') AND
  (
    appointment_id IS NOT NULL AND 
    public.is_assigned_to_job(auth.uid(), appointment_id)
  )
);

-- Platform admin can view all
CREATE POLICY "quotes_platform_admin" ON public.quotes
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'platform_admin'::public.app_role));

-- ============================================
-- LEADS POLICIES
-- Marketing: all leads in company
-- Admin/CustomerService: all leads in company
-- ============================================

CREATE POLICY "leads_marketing_access" ON public.leads
FOR ALL TO authenticated
USING (
  public.get_user_company_id(auth.uid()) = company_id AND
  public.has_marketing_access(auth.uid())
)
WITH CHECK (
  public.get_user_company_id(auth.uid()) = company_id AND
  public.has_marketing_access(auth.uid())
);

-- Platform admin can view all
CREATE POLICY "leads_platform_admin" ON public.leads
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'platform_admin'::public.app_role));

-- ============================================
-- MARKETING_CAMPAIGNS POLICIES
-- Marketing: all campaigns in company
-- Admin/CustomerService: all campaigns in company
-- ============================================

CREATE POLICY "marketing_campaigns_marketing_access" ON public.marketing_campaigns
FOR ALL TO authenticated
USING (
  public.get_user_company_id(auth.uid()) = company_id AND
  public.has_marketing_access(auth.uid())
)
WITH CHECK (
  public.get_user_company_id(auth.uid()) = company_id AND
  public.has_marketing_access(auth.uid())
);

-- Platform admin can view all
CREATE POLICY "marketing_campaigns_platform_admin" ON public.marketing_campaigns
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'platform_admin'::public.app_role));

-- ============================================
-- CAMPAIGN_RECIPIENTS POLICIES
-- Marketing: all recipients in company
-- Admin/CustomerService: all recipients in company
-- ============================================

CREATE POLICY "campaign_recipients_marketing_access" ON public.campaign_recipients
FOR ALL TO authenticated
USING (
  public.get_user_company_id(auth.uid()) = company_id AND
  public.has_marketing_access(auth.uid())
)
WITH CHECK (
  public.get_user_company_id(auth.uid()) = company_id AND
  public.has_marketing_access(auth.uid())
);

-- Platform admin can view all
CREATE POLICY "campaign_recipients_platform_admin" ON public.campaign_recipients
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'platform_admin'::public.app_role));

-- ============================================
-- CUSTOMER_PROFILES POLICIES
-- Technicians: only customers for their assigned jobs
-- Customer Service/Dispatch: all customers in company
-- Admin: all customers in company
-- ============================================

CREATE POLICY "customer_profiles_full_access" ON public.customer_profiles
FOR ALL TO authenticated
USING (
  public.get_user_company_id(auth.uid()) = company_id AND
  public.has_dispatch_access(auth.uid())
)
WITH CHECK (
  public.get_user_company_id(auth.uid()) = company_id AND
  public.has_dispatch_access(auth.uid())
);

-- Technicians see only customers for their assigned jobs
CREATE POLICY "customer_profiles_technician_access" ON public.customer_profiles
FOR SELECT TO authenticated
USING (
  public.get_user_company_id(auth.uid()) = company_id AND
  public.has_job_type(auth.uid(), 'technician') AND
  EXISTS (
    SELECT 1 FROM public.appointments a
    JOIN public.job_assignments ja ON ja.appointment_id = a.id
    WHERE ja.employee_id = auth.uid()
    AND (a.customer_email = email OR a.customer_phone = phone)
  )
);

-- Platform admin can view all
CREATE POLICY "customer_profiles_platform_admin" ON public.customer_profiles
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'platform_admin'::public.app_role));

-- ============================================
-- CUSTOMERS TABLE POLICIES
-- Same as customer_profiles
-- ============================================

CREATE POLICY "customers_full_access" ON public.customers
FOR ALL TO authenticated
USING (
  public.get_user_company_id(auth.uid()) = company_id AND
  public.has_dispatch_access(auth.uid())
)
WITH CHECK (
  public.get_user_company_id(auth.uid()) = company_id AND
  public.has_dispatch_access(auth.uid())
);

-- Technicians see only customers for their assigned jobs
CREATE POLICY "customers_technician_access" ON public.customers
FOR SELECT TO authenticated
USING (
  public.get_user_company_id(auth.uid()) = company_id AND
  public.has_job_type(auth.uid(), 'technician') AND
  EXISTS (
    SELECT 1 FROM public.appointments a
    JOIN public.job_assignments ja ON ja.appointment_id = a.id
    WHERE ja.employee_id = auth.uid()
    AND (a.customer_email = email OR a.customer_phone = phone)
  )
);

-- Platform admin can view all
CREATE POLICY "customers_platform_admin" ON public.customers
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'platform_admin'::public.app_role));

-- ============================================
-- CALL_LOGS POLICIES
-- Customer Service/Dispatch: all calls in company
-- Technicians: only calls for their assigned jobs
-- ============================================

DROP POLICY IF EXISTS "call_logs_company_access" ON public.call_logs;
DROP POLICY IF EXISTS "call_logs_platform_admin_view" ON public.call_logs;

CREATE POLICY "call_logs_dispatch_access" ON public.call_logs
FOR ALL TO authenticated
USING (
  public.get_user_company_id(auth.uid()) = company_id AND
  public.has_dispatch_access(auth.uid())
)
WITH CHECK (
  public.get_user_company_id(auth.uid()) = company_id AND
  public.has_dispatch_access(auth.uid())
);

-- Technicians see only call logs for their assigned appointments
CREATE POLICY "call_logs_technician_access" ON public.call_logs
FOR SELECT TO authenticated
USING (
  public.get_user_company_id(auth.uid()) = company_id AND
  public.has_job_type(auth.uid(), 'technician') AND
  appointment_id IS NOT NULL AND
  public.is_assigned_to_job(auth.uid(), appointment_id)
);

CREATE POLICY "call_logs_platform_admin" ON public.call_logs
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'platform_admin'::public.app_role));

-- ============================================
-- CUSTOMER_FEEDBACK POLICIES
-- Marketing: all feedback for analytics
-- Customer Service: all feedback
-- Technicians: feedback for their jobs
-- ============================================

DROP POLICY IF EXISTS "customer_feedback_company_access" ON public.customer_feedback;
DROP POLICY IF EXISTS "customer_feedback_platform_admin_view" ON public.customer_feedback;

CREATE POLICY "customer_feedback_full_access" ON public.customer_feedback
FOR ALL TO authenticated
USING (
  public.get_user_company_id(auth.uid()) = company_id AND
  (public.has_full_access(auth.uid()) OR public.has_marketing_access(auth.uid()))
)
WITH CHECK (
  public.get_user_company_id(auth.uid()) = company_id AND
  (public.has_full_access(auth.uid()) OR public.has_marketing_access(auth.uid()))
);

-- Technicians see only feedback for their jobs
CREATE POLICY "customer_feedback_technician_access" ON public.customer_feedback
FOR SELECT TO authenticated
USING (
  public.get_user_company_id(auth.uid()) = company_id AND
  public.has_job_type(auth.uid(), 'technician') AND
  (
    employee_id = auth.uid() OR
    (appointment_id IS NOT NULL AND public.is_assigned_to_job(auth.uid(), appointment_id))
  )
);

CREATE POLICY "customer_feedback_platform_admin" ON public.customer_feedback
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'platform_admin'::public.app_role));