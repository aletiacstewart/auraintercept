-- Add weekly digest time column to companies table
ALTER TABLE public.companies 
ADD COLUMN weekly_digest_time time DEFAULT '09:00'::time;