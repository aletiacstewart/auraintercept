-- Add public_app_url column to companies table for technician QR codes
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS public_app_url text;