-- Create sms_keywords table for keyword auto-responder
CREATE TABLE public.sms_keywords (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  response_message TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  hit_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, keyword)
);

-- Enable RLS
ALTER TABLE public.sms_keywords ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Companies can only manage their own keywords
CREATE POLICY "Users can view their company's keywords"
ON public.sms_keywords
FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can create keywords for their company"
ON public.sms_keywords
FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can update their company's keywords"
ON public.sms_keywords
FOR UPDATE
USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can delete their company's keywords"
ON public.sms_keywords
FOR DELETE
USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Function to increment hit count (called from edge function with service role)
CREATE OR REPLACE FUNCTION public.increment_keyword_hit(keyword_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.sms_keywords
  SET hit_count = hit_count + 1, updated_at = now()
  WHERE id = keyword_id;
END;
$$;

-- Create updated_at trigger
CREATE TRIGGER update_sms_keywords_updated_at
BEFORE UPDATE ON public.sms_keywords
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for fast keyword lookups
CREATE INDEX idx_sms_keywords_company_keyword ON public.sms_keywords(company_id, keyword) WHERE is_enabled = true;