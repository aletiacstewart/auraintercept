-- Add default notification preferences to companies table
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS default_sms_enabled boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS default_email_enabled boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS default_call_enabled boolean NOT NULL DEFAULT true;