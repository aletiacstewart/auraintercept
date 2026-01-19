-- Create company_ai_content_profiles table for AI content generation context
CREATE TABLE public.company_ai_content_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL UNIQUE REFERENCES public.companies(id) ON DELETE CASCADE,
  -- Industries (like Google My Business categories)
  primary_industry TEXT,
  secondary_industries TEXT[] DEFAULT '{}',
  -- Keywords for content generation
  keywords TEXT[] DEFAULT '{}',
  -- Business description and context
  business_description TEXT,
  unique_selling_points TEXT[] DEFAULT '{}',
  target_audience TEXT,
  -- Content preferences
  tone TEXT DEFAULT 'professional', -- professional, friendly, casual, formal, energetic
  brand_voice TEXT, -- Custom brand voice description
  -- Things to avoid in content
  avoid_keywords TEXT[] DEFAULT '{}',
  avoid_topics TEXT[] DEFAULT '{}',
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_ai_content_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their company AI content profile"
ON public.company_ai_content_profiles
FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can create their company AI content profile"
ON public.company_ai_content_profiles
FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can update their company AI content profile"
ON public.company_ai_content_profiles
FOR UPDATE
USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can delete their company AI content profile"
ON public.company_ai_content_profiles
FOR DELETE
USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_company_ai_content_profiles_updated_at
BEFORE UPDATE ON public.company_ai_content_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE public.company_ai_content_profiles IS 'Stores AI content generation context including industries, keywords, business description, and content preferences for the AI content generator';
COMMENT ON COLUMN public.company_ai_content_profiles.primary_industry IS 'Main industry category (like Google My Business)';
COMMENT ON COLUMN public.company_ai_content_profiles.secondary_industries IS 'Additional industry categories';
COMMENT ON COLUMN public.company_ai_content_profiles.keywords IS 'Keywords to include in generated content';
COMMENT ON COLUMN public.company_ai_content_profiles.unique_selling_points IS 'Key differentiators and USPs for the business';
COMMENT ON COLUMN public.company_ai_content_profiles.tone IS 'Preferred content tone: professional, friendly, casual, formal, energetic';
COMMENT ON COLUMN public.company_ai_content_profiles.avoid_keywords IS 'Words/phrases to avoid in generated content';
COMMENT ON COLUMN public.company_ai_content_profiles.avoid_topics IS 'Topics to avoid in generated content';