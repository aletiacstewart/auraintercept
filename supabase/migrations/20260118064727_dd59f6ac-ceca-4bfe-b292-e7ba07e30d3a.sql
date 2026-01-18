-- Add customer_prefs_enabled column to companies table
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS customer_prefs_enabled boolean DEFAULT true;