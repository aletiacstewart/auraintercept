ALTER TABLE public.tenant_integrations
  ADD COLUMN IF NOT EXISTS signalwire_campaign_id text,
  ADD COLUMN IF NOT EXISTS signalwire_csp_reference text,
  ADD COLUMN IF NOT EXISTS signalwire_campaign_status text,
  ADD COLUMN IF NOT EXISTS signalwire_campaign_number_attached boolean,
  ADD COLUMN IF NOT EXISTS signalwire_campaign_synced_at timestamptz,
  ADD COLUMN IF NOT EXISTS signalwire_campaign_last_error text,
  ADD COLUMN IF NOT EXISTS signalwire_campaign_raw jsonb;