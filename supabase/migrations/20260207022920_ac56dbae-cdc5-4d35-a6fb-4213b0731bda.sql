-- Add SignalWire columns to tenant_integrations table
-- Migration: Twilio to SignalWire telephony provider

-- Add SignalWire columns (keeping Twilio columns temporarily for backward compatibility)
ALTER TABLE public.tenant_integrations 
ADD COLUMN IF NOT EXISTS signalwire_project_id TEXT,
ADD COLUMN IF NOT EXISTS signalwire_api_token TEXT,
ADD COLUMN IF NOT EXISTS signalwire_phone_number TEXT,
ADD COLUMN IF NOT EXISTS signalwire_space_url TEXT;

-- Add helpful comments for documentation
COMMENT ON COLUMN public.tenant_integrations.signalwire_project_id IS 'SignalWire Project ID (replaces Twilio Account SID)';
COMMENT ON COLUMN public.tenant_integrations.signalwire_api_token IS 'SignalWire API Token (replaces Twilio Auth Token)';
COMMENT ON COLUMN public.tenant_integrations.signalwire_phone_number IS 'SignalWire Phone Number in E.164 format';
COMMENT ON COLUMN public.tenant_integrations.signalwire_space_url IS 'SignalWire Space URL (e.g., yourspace.signalwire.com)';