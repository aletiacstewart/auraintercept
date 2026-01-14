-- =====================================================
-- CRM COMPATIBILITY ENHANCEMENTS MIGRATION
-- Adds tracking columns and creates new tables for CRM sync
-- =====================================================

-- 1. Add CRM tracking columns to leads table
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS crm_contact_id TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS crm_lead_id TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS crm_provider TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'pending';
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS campaign_source TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS utm_source TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS utm_medium TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS utm_campaign TEXT;

-- 2. Add CRM tracking columns to appointments table
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS crm_deal_id TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS crm_activity_id TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS crm_provider TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS deal_stage TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS deal_value NUMERIC;

-- 3. Add CRM tracking columns to inventory_items table
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS external_sku TEXT;
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS crm_product_id TEXT;
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS manufacturer_part_number TEXT;
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS barcode TEXT;
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

-- 4. Add CRM tracking columns to warranty_records table
ALTER TABLE public.warranty_records ADD COLUMN IF NOT EXISTS crm_case_id TEXT;
ALTER TABLE public.warranty_records ADD COLUMN IF NOT EXISTS crm_asset_id TEXT;
ALTER TABLE public.warranty_records ADD COLUMN IF NOT EXISTS serial_number TEXT;
ALTER TABLE public.warranty_records ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

-- 5. Add CRM tracking columns to services table
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS crm_product_id TEXT;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS sync_to_crm BOOLEAN DEFAULT false;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

-- 6. Create customers table with CRM-compatible fields
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  -- Standard CRM Contact Fields
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  mobile_phone TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'US',
  -- CRM Sync Fields
  crm_contact_id TEXT,
  crm_account_id TEXT,
  crm_provider TEXT,
  last_synced_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'pending',
  -- Lifecycle & Attribution
  lifecycle_stage TEXT DEFAULT 'lead',
  lead_source TEXT,
  customer_since DATE,
  -- Communication Preferences
  email_opt_in BOOLEAN DEFAULT true,
  sms_opt_in BOOLEAN DEFAULT true,
  call_opt_in BOOLEAN DEFAULT true,
  preferred_contact_method TEXT,
  -- Metadata
  tags TEXT[],
  custom_fields JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  -- Constraints
  CONSTRAINT customers_company_email_unique UNIQUE(company_id, email)
);

-- 7. Create CRM field mappings table
CREATE TABLE IF NOT EXISTS public.crm_field_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  connection_id UUID REFERENCES public.crm_connections(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL, -- 'contact', 'lead', 'deal', 'product', 'activity'
  local_field TEXT NOT NULL,
  crm_field TEXT NOT NULL,
  direction TEXT DEFAULT 'bidirectional', -- 'inbound', 'outbound', 'bidirectional'
  transform_function TEXT, -- Optional: 'uppercase', 'lowercase', 'phone_format', etc.
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT crm_field_mappings_unique UNIQUE(company_id, entity_type, local_field)
);

-- 8. Enable RLS on new tables
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_field_mappings ENABLE ROW LEVEL SECURITY;

-- 9. RLS policies for customers table
CREATE POLICY "Users can view customers for their company" 
ON public.customers FOR SELECT 
USING (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Users can insert customers for their company" 
ON public.customers FOR INSERT 
WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Users can update customers for their company" 
ON public.customers FOR UPDATE 
USING (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete customers for their company" 
ON public.customers FOR DELETE 
USING (company_id = public.get_user_company_id(auth.uid()));

-- 10. RLS policies for crm_field_mappings table
CREATE POLICY "Users can view CRM field mappings for their company" 
ON public.crm_field_mappings FOR SELECT 
USING (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Users can insert CRM field mappings for their company" 
ON public.crm_field_mappings FOR INSERT 
WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Users can update CRM field mappings for their company" 
ON public.crm_field_mappings FOR UPDATE 
USING (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete CRM field mappings for their company" 
ON public.crm_field_mappings FOR DELETE 
USING (company_id = public.get_user_company_id(auth.uid()));

-- 11. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_customers_company_id ON public.customers(company_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_crm_contact_id ON public.customers(crm_contact_id);
CREATE INDEX IF NOT EXISTS idx_customers_lifecycle_stage ON public.customers(lifecycle_stage);
CREATE INDEX IF NOT EXISTS idx_crm_field_mappings_company_id ON public.crm_field_mappings(company_id);
CREATE INDEX IF NOT EXISTS idx_crm_field_mappings_entity_type ON public.crm_field_mappings(entity_type);
CREATE INDEX IF NOT EXISTS idx_leads_crm_contact_id ON public.leads(crm_contact_id);
CREATE INDEX IF NOT EXISTS idx_leads_sync_status ON public.leads(sync_status);
CREATE INDEX IF NOT EXISTS idx_appointments_crm_deal_id ON public.appointments(crm_deal_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_external_sku ON public.inventory_items(external_sku);
CREATE INDEX IF NOT EXISTS idx_inventory_items_barcode ON public.inventory_items(barcode);
CREATE INDEX IF NOT EXISTS idx_warranty_records_serial_number ON public.warranty_records(serial_number);

-- 12. Add updated_at trigger for customers table
CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 13. Add updated_at trigger for crm_field_mappings table
CREATE TRIGGER update_crm_field_mappings_updated_at
BEFORE UPDATE ON public.crm_field_mappings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();