-- Add contact info columns to companies table (these are needed for the functions)
ALTER TABLE public.companies 
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT;