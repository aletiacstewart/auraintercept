ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS call_forwarding_carrier TEXT,
  ADD COLUMN IF NOT EXISTS call_forwarding_target_number TEXT,
  ADD COLUMN IF NOT EXISTS call_forwarding_configured_at TIMESTAMPTZ;