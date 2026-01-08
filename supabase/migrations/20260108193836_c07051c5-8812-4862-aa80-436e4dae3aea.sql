-- Add service area and category columns to companies table for location-based search
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS service_area_zip_codes text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS service_area_cities text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS service_categories text[] DEFAULT '{}';

-- Create GIN indexes for efficient array searching
CREATE INDEX IF NOT EXISTS idx_companies_service_zip_codes ON public.companies USING GIN (service_area_zip_codes);
CREATE INDEX IF NOT EXISTS idx_companies_service_cities ON public.companies USING GIN (service_area_cities);
CREATE INDEX IF NOT EXISTS idx_companies_service_categories ON public.companies USING GIN (service_categories);