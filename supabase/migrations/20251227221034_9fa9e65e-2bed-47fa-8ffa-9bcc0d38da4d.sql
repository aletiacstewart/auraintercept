-- Create enum for supported CRM providers
CREATE TYPE public.crm_provider AS ENUM ('hubspot', 'salesforce', 'zoho', 'pipedrive', 'custom_webhook');

-- Create enum for connection status
CREATE TYPE public.crm_connection_status AS ENUM ('disconnected', 'pending', 'connected', 'error', 'expired');

-- Create enum for sync direction
CREATE TYPE public.crm_sync_direction AS ENUM ('push', 'pull', 'bidirectional');

-- Create enum for entity types that can be synced
CREATE TYPE public.crm_entity_type AS ENUM ('contact', 'lead', 'deal', 'activity', 'appointment', 'invoice', 'quote');

-- Table: crm_connections - Store company CRM configurations
CREATE TABLE public.crm_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  provider crm_provider NOT NULL,
  status crm_connection_status NOT NULL DEFAULT 'disconnected',
  
  -- OAuth tokens (encrypted in practice, stored securely)
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Provider-specific settings
  settings JSONB DEFAULT '{}'::jsonb,
  
  -- Sync configuration
  sync_direction crm_sync_direction DEFAULT 'bidirectional',
  sync_contacts BOOLEAN DEFAULT true,
  sync_leads BOOLEAN DEFAULT true,
  sync_deals BOOLEAN DEFAULT true,
  sync_activities BOOLEAN DEFAULT true,
  
  -- Metadata
  last_sync_at TIMESTAMP WITH TIME ZONE,
  last_error TEXT,
  connected_at TIMESTAMP WITH TIME ZONE,
  connected_by UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- One connection per provider per company
  UNIQUE(company_id, provider)
);

-- Table: crm_sync_logs - Audit trail for sync operations
CREATE TABLE public.crm_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES public.crm_connections(id) ON DELETE CASCADE,
  
  -- Sync details
  entity_type crm_entity_type NOT NULL,
  direction crm_sync_direction NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, success, failed, partial
  
  -- Counts
  records_processed INTEGER DEFAULT 0,
  records_created INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  
  -- Error details
  error_message TEXT,
  error_details JSONB,
  
  -- Timing
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: crm_entity_mappings - Link local entities to CRM records
CREATE TABLE public.crm_entity_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES public.crm_connections(id) ON DELETE CASCADE,
  
  -- Local entity reference
  entity_type crm_entity_type NOT NULL,
  local_entity_id UUID NOT NULL,
  
  -- CRM entity reference
  crm_entity_id TEXT NOT NULL,
  crm_entity_type TEXT, -- Provider-specific type name
  
  -- Sync metadata
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  sync_hash TEXT, -- Hash of last synced data to detect changes
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- One mapping per local entity per connection
  UNIQUE(connection_id, entity_type, local_entity_id)
);

-- Create indexes for performance
CREATE INDEX idx_crm_connections_company ON public.crm_connections(company_id);
CREATE INDEX idx_crm_connections_status ON public.crm_connections(status);
CREATE INDEX idx_crm_sync_logs_company ON public.crm_sync_logs(company_id);
CREATE INDEX idx_crm_sync_logs_connection ON public.crm_sync_logs(connection_id);
CREATE INDEX idx_crm_sync_logs_status ON public.crm_sync_logs(status);
CREATE INDEX idx_crm_entity_mappings_company ON public.crm_entity_mappings(company_id);
CREATE INDEX idx_crm_entity_mappings_local ON public.crm_entity_mappings(local_entity_id);
CREATE INDEX idx_crm_entity_mappings_crm ON public.crm_entity_mappings(crm_entity_id);

-- Enable RLS on all tables
ALTER TABLE public.crm_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_entity_mappings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for crm_connections

-- Company admins can manage their own CRM connections
CREATE POLICY "Company admins can manage CRM connections"
ON public.crm_connections
FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND has_role(auth.uid(), 'company_admin'::app_role)
)
WITH CHECK (
  company_id = get_user_company_id(auth.uid()) 
  AND has_role(auth.uid(), 'company_admin'::app_role)
);

-- Employees can view their company's CRM connection status (not tokens)
CREATE POLICY "Employees can view CRM connection status"
ON public.crm_connections
FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

-- Platform admins can view all CRM connections
CREATE POLICY "Platform admins can view all CRM connections"
ON public.crm_connections
FOR SELECT
USING (has_role(auth.uid(), 'platform_admin'::app_role));

-- RLS Policies for crm_sync_logs

-- Company admins can view their sync logs
CREATE POLICY "Company admins can view CRM sync logs"
ON public.crm_sync_logs
FOR SELECT
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND has_role(auth.uid(), 'company_admin'::app_role)
);

-- Platform admins can view all sync logs
CREATE POLICY "Platform admins can view all CRM sync logs"
ON public.crm_sync_logs
FOR SELECT
USING (has_role(auth.uid(), 'platform_admin'::app_role));

-- RLS Policies for crm_entity_mappings

-- Company admins can manage their entity mappings
CREATE POLICY "Company admins can manage CRM entity mappings"
ON public.crm_entity_mappings
FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND has_role(auth.uid(), 'company_admin'::app_role)
)
WITH CHECK (
  company_id = get_user_company_id(auth.uid()) 
  AND has_role(auth.uid(), 'company_admin'::app_role)
);

-- Employees can view entity mappings for their company
CREATE POLICY "Employees can view CRM entity mappings"
ON public.crm_entity_mappings
FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

-- Platform admins can view all entity mappings
CREATE POLICY "Platform admins can view all CRM entity mappings"
ON public.crm_entity_mappings
FOR SELECT
USING (has_role(auth.uid(), 'platform_admin'::app_role));

-- Create trigger for updated_at on crm_connections
CREATE TRIGGER update_crm_connections_updated_at
BEFORE UPDATE ON public.crm_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on crm_entity_mappings
CREATE TRIGGER update_crm_entity_mappings_updated_at
BEFORE UPDATE ON public.crm_entity_mappings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();