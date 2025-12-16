-- Add cost alert settings to companies table
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS cost_alert_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS cost_alert_threshold integer DEFAULT 20,
ADD COLUMN IF NOT EXISTS cost_alert_email text,
ADD COLUMN IF NOT EXISTS last_cost_alert_at timestamp with time zone;