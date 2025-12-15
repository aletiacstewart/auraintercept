-- Add metric customization columns for weekly digest
ALTER TABLE public.companies 
ADD COLUMN weekly_digest_include_appointments boolean DEFAULT true,
ADD COLUMN weekly_digest_include_reminders boolean DEFAULT true,
ADD COLUMN weekly_digest_include_subscriptions boolean DEFAULT true;

-- Add metric customization columns for monthly digest
ALTER TABLE public.companies 
ADD COLUMN monthly_digest_include_appointments boolean DEFAULT true,
ADD COLUMN monthly_digest_include_reminders boolean DEFAULT true,
ADD COLUMN monthly_digest_include_subscriptions boolean DEFAULT true;

-- Add metric customization columns for quarterly digest
ALTER TABLE public.companies 
ADD COLUMN quarterly_digest_include_appointments boolean DEFAULT true,
ADD COLUMN quarterly_digest_include_reminders boolean DEFAULT true,
ADD COLUMN quarterly_digest_include_subscriptions boolean DEFAULT true;