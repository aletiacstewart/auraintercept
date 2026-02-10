
-- Add call routing columns to companies table
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS call_routing_mode text NOT NULL DEFAULT 'ai_direct',
  ADD COLUMN IF NOT EXISTS business_phone text,
  ADD COLUMN IF NOT EXISTS ring_timeout_seconds integer NOT NULL DEFAULT 15;
