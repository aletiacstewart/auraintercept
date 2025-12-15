-- Add quarterly digest columns to companies table
ALTER TABLE public.companies 
ADD COLUMN quarterly_digest_enabled boolean DEFAULT false,
ADD COLUMN quarterly_digest_email text,
ADD COLUMN quarterly_digest_month integer DEFAULT 1,
ADD COLUMN quarterly_digest_day integer DEFAULT 1,
ADD COLUMN quarterly_digest_time time DEFAULT '09:00'::time,
ADD COLUMN quarterly_digest_timezone text DEFAULT 'America/New_York',
ADD COLUMN last_quarterly_digest_at timestamp with time zone;