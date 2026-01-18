-- Add new digest include columns for emails and SMS to companies table
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS weekly_digest_include_emails BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS weekly_digest_include_sms BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS monthly_digest_include_emails BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS monthly_digest_include_sms BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS quarterly_digest_include_emails BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS quarterly_digest_include_sms BOOLEAN DEFAULT true;