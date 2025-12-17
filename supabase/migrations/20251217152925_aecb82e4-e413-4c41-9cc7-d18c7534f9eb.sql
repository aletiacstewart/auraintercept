-- Add hour_type column to business_hours for different schedule types
ALTER TABLE public.business_hours 
ADD COLUMN hour_type text NOT NULL DEFAULT 'office';

-- Drop the existing unique constraint if it exists
ALTER TABLE public.business_hours 
DROP CONSTRAINT IF EXISTS business_hours_company_id_day_of_week_key;

-- Add new unique constraint including hour_type
ALTER TABLE public.business_hours 
ADD CONSTRAINT business_hours_company_day_type_unique UNIQUE (company_id, day_of_week, hour_type);

-- Add comment explaining hour types
COMMENT ON COLUMN public.business_hours.hour_type IS 'Type of hours: office, field, emergency, holiday';