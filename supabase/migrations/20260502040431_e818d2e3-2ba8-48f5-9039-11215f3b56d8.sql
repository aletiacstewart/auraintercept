-- Drop legacy warranty + CRM tables (cascade to drop dependent constraints)
DROP FUNCTION IF EXISTS public.get_company_warranty_policies(uuid) CASCADE;
DROP TABLE IF EXISTS public.warranty_claims CASCADE;
DROP TABLE IF EXISTS public.warranty_records CASCADE;
DROP TABLE IF EXISTS public.warranty_policies CASCADE;

DROP TABLE IF EXISTS public.crm_entity_mappings CASCADE;
DROP TABLE IF EXISTS public.crm_field_mappings CASCADE;
DROP TABLE IF EXISTS public.crm_sync_logs CASCADE;
DROP TABLE IF EXISTS public.crm_connections CASCADE;

-- Drop legacy crm_product_id columns
ALTER TABLE public.services DROP COLUMN IF EXISTS crm_product_id;
ALTER TABLE public.inventory_items DROP COLUMN IF EXISTS crm_product_id;

-- Drop the warranties access flag
ALTER TABLE public.company_role_permissions DROP COLUMN IF EXISTS can_access_warranties;

-- Recreate has_feature_access without warranties branch
CREATE OR REPLACE FUNCTION public.has_feature_access(_user_id uuid, _feature text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT 
    public.has_role(_user_id, 'platform_admin'::public.app_role)
    OR public.has_role(_user_id, 'company_admin'::public.app_role)
    OR EXISTS (
      SELECT 1
      FROM public.company_role_permissions crp
      JOIN public.employee_job_assignments eja ON eja.job_type = crp.job_type
      WHERE eja.employee_id = _user_id
        AND crp.company_id = public.get_user_company_id(_user_id)
        AND (
          (_feature = 'appointments' AND crp.can_access_appointments = true) OR
          (_feature = 'customers' AND crp.can_access_customers = true) OR
          (_feature = 'invoices' AND crp.can_access_invoices = true) OR
          (_feature = 'quotes' AND crp.can_access_quotes = true) OR
          (_feature = 'leads' AND crp.can_access_leads = true) OR
          (_feature = 'inventory' AND crp.can_access_inventory = true) OR
          (_feature = 'campaigns' AND crp.can_access_campaigns = true) OR
          (_feature = 'analytics' AND crp.can_access_analytics = true) OR
          (_feature = 'field_ops' AND crp.can_access_field_ops = true)
        )
    )
$$;
