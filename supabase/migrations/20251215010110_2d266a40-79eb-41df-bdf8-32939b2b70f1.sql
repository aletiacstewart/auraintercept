-- Add timezone column to companies table
ALTER TABLE public.companies 
ADD COLUMN weekly_digest_timezone text DEFAULT 'America/New_York';