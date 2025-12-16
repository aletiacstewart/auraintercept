-- Add new columns to services table for enhanced service options
ALTER TABLE public.services
ADD COLUMN service_type text DEFAULT 'in_person',
ADD COLUMN service_type_other text,
ADD COLUMN flat_fee numeric,
ADD COLUMN hourly_rate numeric,
ADD COLUMN parts_cost numeric;

-- Make duration_minutes nullable (optional)
ALTER TABLE public.services
ALTER COLUMN duration_minutes DROP NOT NULL,
ALTER COLUMN duration_minutes DROP DEFAULT;