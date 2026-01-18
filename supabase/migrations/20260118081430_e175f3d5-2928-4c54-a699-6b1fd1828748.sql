-- Create table for smart website holiday messages
CREATE TABLE public.smart_website_holidays (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  website_id uuid NOT NULL REFERENCES public.smart_websites(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  holiday_name text NOT NULL,
  holiday_date date NOT NULL,
  custom_headline text NOT NULL,
  custom_subheadline text,
  custom_cta_text text,
  custom_cta_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.smart_website_holidays ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Companies can view their own holiday messages"
ON public.smart_website_holidays FOR SELECT
USING (company_id IN (
  SELECT company_id FROM public.profiles WHERE id = auth.uid()
));

CREATE POLICY "Companies can create their own holiday messages"
ON public.smart_website_holidays FOR INSERT
WITH CHECK (company_id IN (
  SELECT company_id FROM public.profiles WHERE id = auth.uid()
));

CREATE POLICY "Companies can update their own holiday messages"
ON public.smart_website_holidays FOR UPDATE
USING (company_id IN (
  SELECT company_id FROM public.profiles WHERE id = auth.uid()
));

CREATE POLICY "Companies can delete their own holiday messages"
ON public.smart_website_holidays FOR DELETE
USING (company_id IN (
  SELECT company_id FROM public.profiles WHERE id = auth.uid()
));

-- Index for efficient date lookups
CREATE INDEX idx_smart_website_holidays_date ON public.smart_website_holidays(website_id, holiday_date);

-- Function to get active holiday for a website on current date
CREATE OR REPLACE FUNCTION get_website_active_holiday(p_website_id uuid, p_check_date date DEFAULT CURRENT_DATE)
RETURNS TABLE (
  holiday_name text,
  custom_headline text,
  custom_subheadline text,
  custom_cta_text text,
  custom_cta_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    h.holiday_name,
    h.custom_headline,
    h.custom_subheadline,
    h.custom_cta_text,
    h.custom_cta_url
  FROM smart_website_holidays h
  WHERE h.website_id = p_website_id
    AND h.holiday_date = p_check_date
    AND h.is_active = true
  LIMIT 1;
END;
$$;