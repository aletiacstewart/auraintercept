-- Complete role-based RLS policies for remaining tables
-- Using DROP POLICY IF EXISTS to handle existing policies

-- WINBACK_OFFERS
DROP POLICY IF EXISTS "winback_offers_company_access" ON public.winback_offers;
DROP POLICY IF EXISTS "winback_offers_platform_admin_view" ON public.winback_offers;
DROP POLICY IF EXISTS "winback_offers_marketing_access" ON public.winback_offers;
REVOKE ALL ON public.winback_offers FROM anon;

CREATE POLICY "winback_offers_marketing_access" ON public.winback_offers FOR ALL TO authenticated
USING (public.get_user_company_id(auth.uid()) = company_id AND public.has_marketing_access(auth.uid()))
WITH CHECK (public.get_user_company_id(auth.uid()) = company_id AND public.has_marketing_access(auth.uid()));

CREATE POLICY "winback_offers_platform_admin" ON public.winback_offers FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'platform_admin'::public.app_role));

-- TENANT_INTEGRATIONS (admin only - high security)
DROP POLICY IF EXISTS "tenant_integrations_company_access" ON public.tenant_integrations;
DROP POLICY IF EXISTS "tenant_integrations_platform_admin_view" ON public.tenant_integrations;
DROP POLICY IF EXISTS "tenant_integrations_admin_only" ON public.tenant_integrations;
DROP POLICY IF EXISTS "tenant_integrations_company_admin_only" ON public.tenant_integrations;
DROP POLICY IF EXISTS "tenant_integrations_platform_admin" ON public.tenant_integrations;
REVOKE ALL ON public.tenant_integrations FROM anon;

CREATE POLICY "tenant_integrations_company_admin" ON public.tenant_integrations FOR ALL TO authenticated
USING (public.get_user_company_id(auth.uid()) = company_id AND public.has_role(auth.uid(), 'company_admin'::public.app_role))
WITH CHECK (public.get_user_company_id(auth.uid()) = company_id AND public.has_role(auth.uid(), 'company_admin'::public.app_role));

CREATE POLICY "tenant_integrations_platform" ON public.tenant_integrations FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'platform_admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'platform_admin'::public.app_role));

-- GOOGLE_CALENDAR_CONNECTIONS (admin only)
DROP POLICY IF EXISTS "google_calendar_connections_company_access" ON public.google_calendar_connections;
DROP POLICY IF EXISTS "google_calendar_connections_platform_admin_view" ON public.google_calendar_connections;
DROP POLICY IF EXISTS "google_calendar_connections_admin_only" ON public.google_calendar_connections;
DROP POLICY IF EXISTS "google_calendar_admin_only" ON public.google_calendar_connections;
DROP POLICY IF EXISTS "google_calendar_connections_platform_admin" ON public.google_calendar_connections;
REVOKE ALL ON public.google_calendar_connections FROM anon;

CREATE POLICY "google_calendar_company_admin" ON public.google_calendar_connections FOR ALL TO authenticated
USING (public.get_user_company_id(auth.uid()) = company_id AND public.has_role(auth.uid(), 'company_admin'::public.app_role))
WITH CHECK (public.get_user_company_id(auth.uid()) = company_id AND public.has_role(auth.uid(), 'company_admin'::public.app_role));

CREATE POLICY "google_calendar_platform" ON public.google_calendar_connections FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'platform_admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'platform_admin'::public.app_role));

-- CRM_CONNECTIONS (admin only)
DROP POLICY IF EXISTS "crm_connections_company_access" ON public.crm_connections;
DROP POLICY IF EXISTS "crm_connections_platform_admin_view" ON public.crm_connections;
DROP POLICY IF EXISTS "crm_connections_admin_only" ON public.crm_connections;
DROP POLICY IF EXISTS "crm_connections_platform_admin" ON public.crm_connections;
REVOKE ALL ON public.crm_connections FROM anon;

CREATE POLICY "crm_connections_company_admin" ON public.crm_connections FOR ALL TO authenticated
USING (public.get_user_company_id(auth.uid()) = company_id AND public.has_role(auth.uid(), 'company_admin'::public.app_role))
WITH CHECK (public.get_user_company_id(auth.uid()) = company_id AND public.has_role(auth.uid(), 'company_admin'::public.app_role));

CREATE POLICY "crm_connections_platform" ON public.crm_connections FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'platform_admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'platform_admin'::public.app_role));

-- CUSTOMER_REFERRALS
DROP POLICY IF EXISTS "customer_referrals_company_access" ON public.customer_referrals;
DROP POLICY IF EXISTS "customer_referrals_platform_admin_view" ON public.customer_referrals;
DROP POLICY IF EXISTS "customer_referrals_marketing_access" ON public.customer_referrals;
DROP POLICY IF EXISTS "customer_referrals_platform_admin" ON public.customer_referrals;
REVOKE ALL ON public.customer_referrals FROM anon;

CREATE POLICY "customer_referrals_marketing" ON public.customer_referrals FOR ALL TO authenticated
USING (public.get_user_company_id(auth.uid()) = company_id AND public.has_marketing_access(auth.uid()))
WITH CHECK (public.get_user_company_id(auth.uid()) = company_id AND public.has_marketing_access(auth.uid()));

CREATE POLICY "customer_referrals_platform" ON public.customer_referrals FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'platform_admin'::public.app_role));

-- REMINDER_LOGS
DROP POLICY IF EXISTS "reminder_logs_company_access" ON public.reminder_logs;
DROP POLICY IF EXISTS "reminder_logs_platform_admin_view" ON public.reminder_logs;
DROP POLICY IF EXISTS "reminder_logs_dispatch_access" ON public.reminder_logs;
DROP POLICY IF EXISTS "reminder_logs_platform_admin" ON public.reminder_logs;
REVOKE ALL ON public.reminder_logs FROM anon;

CREATE POLICY "reminder_logs_dispatch" ON public.reminder_logs FOR ALL TO authenticated
USING (public.get_user_company_id(auth.uid()) = company_id AND public.has_dispatch_access(auth.uid()))
WITH CHECK (public.get_user_company_id(auth.uid()) = company_id AND public.has_dispatch_access(auth.uid()));

CREATE POLICY "reminder_logs_platform" ON public.reminder_logs FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'platform_admin'::public.app_role));

-- SUPPRESSED_EMAILS
DROP POLICY IF EXISTS "suppressed_emails_company_access" ON public.suppressed_emails;
DROP POLICY IF EXISTS "suppressed_emails_platform_admin_view" ON public.suppressed_emails;
DROP POLICY IF EXISTS "suppressed_emails_dispatch_access" ON public.suppressed_emails;
DROP POLICY IF EXISTS "suppressed_emails_platform_admin" ON public.suppressed_emails;
REVOKE ALL ON public.suppressed_emails FROM anon;

CREATE POLICY "suppressed_emails_dispatch" ON public.suppressed_emails FOR ALL TO authenticated
USING (public.get_user_company_id(auth.uid()) = company_id AND public.has_dispatch_access(auth.uid()))
WITH CHECK (public.get_user_company_id(auth.uid()) = company_id AND public.has_dispatch_access(auth.uid()));

CREATE POLICY "suppressed_emails_platform" ON public.suppressed_emails FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'platform_admin'::public.app_role));

-- AI_AGENT_CONTEXT
DROP POLICY IF EXISTS "ai_agent_context_company_access" ON public.ai_agent_context;
DROP POLICY IF EXISTS "ai_agent_context_platform_admin_view" ON public.ai_agent_context;
DROP POLICY IF EXISTS "ai_agent_context_dispatch_access" ON public.ai_agent_context;
DROP POLICY IF EXISTS "ai_agent_context_platform_admin" ON public.ai_agent_context;
REVOKE ALL ON public.ai_agent_context FROM anon;

CREATE POLICY "ai_agent_context_dispatch" ON public.ai_agent_context FOR ALL TO authenticated
USING (public.get_user_company_id(auth.uid()) = company_id AND public.has_dispatch_access(auth.uid()))
WITH CHECK (public.get_user_company_id(auth.uid()) = company_id AND public.has_dispatch_access(auth.uid()));

CREATE POLICY "ai_agent_context_platform" ON public.ai_agent_context FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'platform_admin'::public.app_role));

-- INVENTORY_ITEMS
DROP POLICY IF EXISTS "inventory_items_company_access" ON public.inventory_items;
DROP POLICY IF EXISTS "inventory_items_platform_admin_view" ON public.inventory_items;
DROP POLICY IF EXISTS "inventory_items_full_access" ON public.inventory_items;
DROP POLICY IF EXISTS "inventory_items_technician_read" ON public.inventory_items;
DROP POLICY IF EXISTS "inventory_items_platform_admin" ON public.inventory_items;
REVOKE ALL ON public.inventory_items FROM anon;

CREATE OR REPLACE FUNCTION public.has_inventory_access(_user_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_full_access(_user_id) OR public.has_job_type(_user_id, 'inventory') OR public.has_job_type(_user_id, 'dispatch')
$$;

CREATE POLICY "inventory_items_manage" ON public.inventory_items FOR ALL TO authenticated
USING (public.get_user_company_id(auth.uid()) = company_id AND public.has_inventory_access(auth.uid()))
WITH CHECK (public.get_user_company_id(auth.uid()) = company_id AND public.has_inventory_access(auth.uid()));

CREATE POLICY "inventory_items_tech_read" ON public.inventory_items FOR SELECT TO authenticated
USING (public.get_user_company_id(auth.uid()) = company_id AND public.has_job_type(auth.uid(), 'technician'));

CREATE POLICY "inventory_items_platform" ON public.inventory_items FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'platform_admin'::public.app_role));

-- COMPANIES
DROP POLICY IF EXISTS "companies_company_access" ON public.companies;
DROP POLICY IF EXISTS "companies_platform_admin_view" ON public.companies;
DROP POLICY IF EXISTS "companies_member_read" ON public.companies;
DROP POLICY IF EXISTS "companies_admin_manage" ON public.companies;
DROP POLICY IF EXISTS "companies_platform_admin" ON public.companies;

CREATE POLICY "companies_read" ON public.companies FOR SELECT TO authenticated
USING (public.get_user_company_id(auth.uid()) = id);

CREATE POLICY "companies_admin" ON public.companies FOR ALL TO authenticated
USING (public.get_user_company_id(auth.uid()) = id AND public.has_role(auth.uid(), 'company_admin'::public.app_role))
WITH CHECK (public.get_user_company_id(auth.uid()) = id AND public.has_role(auth.uid(), 'company_admin'::public.app_role));

CREATE POLICY "companies_platform" ON public.companies FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'platform_admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'platform_admin'::public.app_role));

-- PROFILES
DROP POLICY IF EXISTS "profiles_self_access" ON public.profiles;
DROP POLICY IF EXISTS "profiles_company_access" ON public.profiles;
DROP POLICY IF EXISTS "profiles_platform_admin_view" ON public.profiles;
DROP POLICY IF EXISTS "profiles_dispatch_view" ON public.profiles;
DROP POLICY IF EXISTS "profiles_platform_admin" ON public.profiles;

CREATE POLICY "profiles_self" ON public.profiles FOR ALL TO authenticated
USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_dispatch" ON public.profiles FOR SELECT TO authenticated
USING (public.get_user_company_id(auth.uid()) = company_id AND public.has_dispatch_access(auth.uid()));

CREATE POLICY "profiles_platform" ON public.profiles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'platform_admin'::public.app_role));

-- WARRANTY_RECORDS
DROP POLICY IF EXISTS "warranty_records_company_access" ON public.warranty_records;
DROP POLICY IF EXISTS "warranty_records_platform_admin_view" ON public.warranty_records;
DROP POLICY IF EXISTS "warranty_records_billing_access" ON public.warranty_records;
DROP POLICY IF EXISTS "warranty_records_technician_access" ON public.warranty_records;
DROP POLICY IF EXISTS "warranty_records_platform_admin" ON public.warranty_records;
REVOKE ALL ON public.warranty_records FROM anon;

CREATE POLICY "warranty_records_billing" ON public.warranty_records FOR ALL TO authenticated
USING (public.get_user_company_id(auth.uid()) = company_id AND public.has_billing_access(auth.uid()))
WITH CHECK (public.get_user_company_id(auth.uid()) = company_id AND public.has_billing_access(auth.uid()));

CREATE POLICY "warranty_records_tech" ON public.warranty_records FOR SELECT TO authenticated
USING (public.get_user_company_id(auth.uid()) = company_id AND public.has_job_type(auth.uid(), 'technician') AND appointment_id IS NOT NULL AND public.is_assigned_to_job(auth.uid(), appointment_id));

CREATE POLICY "warranty_records_platform" ON public.warranty_records FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'platform_admin'::public.app_role));