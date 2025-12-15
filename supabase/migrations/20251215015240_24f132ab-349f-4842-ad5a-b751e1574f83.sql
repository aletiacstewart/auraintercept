-- Add bounce alert configuration columns to companies
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS bounce_alert_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS bounce_alert_threshold INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS bounce_alert_email TEXT,
ADD COLUMN IF NOT EXISTS last_bounce_alert_at TIMESTAMP WITH TIME ZONE;