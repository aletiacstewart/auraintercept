-- Add duration_text column for flexible duration like "5-10 years"
ALTER TABLE public.warranty_policies 
ADD COLUMN duration_text TEXT;

-- Update existing records to convert months to years text
UPDATE public.warranty_policies 
SET duration_text = 
  CASE 
    WHEN duration_months >= 12 THEN (duration_months / 12)::text || ' year' || CASE WHEN duration_months / 12 > 1 THEN 's' ELSE '' END
    ELSE duration_months::text || ' month' || CASE WHEN duration_months > 1 THEN 's' ELSE '' END
  END
WHERE duration_text IS NULL;