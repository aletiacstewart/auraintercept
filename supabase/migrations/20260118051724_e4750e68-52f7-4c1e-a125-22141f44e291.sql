-- Add SMS opt-out alert settings to companies table
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS sms_optout_alert_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sms_optout_alert_threshold INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS sms_optout_alert_email TEXT,
ADD COLUMN IF NOT EXISTS last_sms_optout_alert_at TIMESTAMP WITH TIME ZONE;