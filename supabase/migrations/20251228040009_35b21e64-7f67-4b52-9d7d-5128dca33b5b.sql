-- Create tts_usage table to track character usage per company per month
CREATE TABLE public.tts_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  characters_used INTEGER NOT NULL DEFAULT 0,
  month_year TEXT NOT NULL, -- Format: '2025-01' for easy monthly tracking
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, month_year)
);

-- Enable RLS
ALTER TABLE public.tts_usage ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Company admins can view their TTS usage"
ON public.tts_usage
FOR SELECT
USING (company_id = get_user_company_id(auth.uid()) AND has_role(auth.uid(), 'company_admin'::app_role));

CREATE POLICY "Platform admins can view all TTS usage"
ON public.tts_usage
FOR SELECT
USING (has_role(auth.uid(), 'platform_admin'::app_role));

CREATE POLICY "Platform admins can manage all TTS usage"
ON public.tts_usage
FOR ALL
USING (has_role(auth.uid(), 'platform_admin'::app_role));

-- Add columns to tenant_integrations for platform TTS fallback
ALTER TABLE public.tenant_integrations 
ADD COLUMN IF NOT EXISTS use_platform_tts BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tts_monthly_limit INTEGER DEFAULT 10000;

-- Create trigger to update updated_at
CREATE TRIGGER update_tts_usage_updated_at
BEFORE UPDATE ON public.tts_usage
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();