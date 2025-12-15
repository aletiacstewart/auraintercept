-- Add monthly digest columns to companies table
ALTER TABLE public.companies 
ADD COLUMN monthly_digest_enabled boolean DEFAULT false,
ADD COLUMN monthly_digest_email text,
ADD COLUMN monthly_digest_day integer DEFAULT 1,
ADD COLUMN monthly_digest_time time DEFAULT '09:00'::time,
ADD COLUMN monthly_digest_timezone text DEFAULT 'America/New_York',
ADD COLUMN last_monthly_digest_at timestamp with time zone;