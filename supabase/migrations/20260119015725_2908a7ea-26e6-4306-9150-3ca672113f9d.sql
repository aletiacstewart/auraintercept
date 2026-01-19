-- Create social_content_drafts table for AI-generated social media content
CREATE TABLE public.social_content_drafts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  job_assignment_id UUID REFERENCES public.job_assignments(id) ON DELETE SET NULL,
  image_url TEXT,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'google_business', 'facebook', 'sms')),
  generated_content TEXT NOT NULL,
  edited_content TEXT,
  hashtags TEXT[],
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'published', 'rejected')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.social_content_drafts ENABLE ROW LEVEL SECURITY;

-- Create policies using company_id from profiles
CREATE POLICY "Company members can view their social content drafts"
ON public.social_content_drafts
FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Company members can insert social content drafts"
ON public.social_content_drafts
FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Company members can update their social content drafts"
ON public.social_content_drafts
FOR UPDATE
USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Company members can delete their social content drafts"
ON public.social_content_drafts
FOR DELETE
USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_social_content_drafts_updated_at
BEFORE UPDATE ON public.social_content_drafts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for efficient querying
CREATE INDEX idx_social_content_drafts_company_status ON public.social_content_drafts(company_id, status);
CREATE INDEX idx_social_content_drafts_job_assignment ON public.social_content_drafts(job_assignment_id);

-- Enable realtime for social content drafts
ALTER PUBLICATION supabase_realtime ADD TABLE public.social_content_drafts;