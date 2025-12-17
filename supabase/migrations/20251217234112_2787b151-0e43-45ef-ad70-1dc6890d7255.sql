-- Add dispatch phone number to companies table
ALTER TABLE public.companies 
ADD COLUMN dispatch_phone TEXT;