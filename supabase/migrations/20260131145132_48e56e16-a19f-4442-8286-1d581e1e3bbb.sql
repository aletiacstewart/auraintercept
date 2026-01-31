-- Create scheduled_social_posts table for batch generation queue
CREATE TABLE IF NOT EXISTS public.scheduled_social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  keywords TEXT[] DEFAULT '{}',
  platforms TEXT[] NOT NULL DEFAULT '{}',
  content_json JSONB NOT NULL DEFAULT '{}',
  image_url TEXT,
  scheduled_for TIMESTAMPTZ NOT NULL,
  timezone TEXT DEFAULT 'America/New_York',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'published', 'rejected', 'failed')),
  batch_id UUID,
  ai_research_used BOOLEAN DEFAULT FALSE,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  publish_error TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scheduled_social_posts ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Company members can view their scheduled social posts"
  ON public.scheduled_social_posts
  FOR SELECT
  USING (
    public.has_role(auth.uid(), 'platform_admin'::public.app_role)
    OR public.get_user_company_id(auth.uid()) = company_id
  );

CREATE POLICY "Company members can create scheduled social posts"
  ON public.scheduled_social_posts
  FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'platform_admin'::public.app_role)
    OR public.get_user_company_id(auth.uid()) = company_id
  );

CREATE POLICY "Company members can update their scheduled social posts"
  ON public.scheduled_social_posts
  FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'platform_admin'::public.app_role)
    OR public.get_user_company_id(auth.uid()) = company_id
  );

CREATE POLICY "Company members can delete their scheduled social posts"
  ON public.scheduled_social_posts
  FOR DELETE
  USING (
    public.has_role(auth.uid(), 'platform_admin'::public.app_role)
    OR public.get_user_company_id(auth.uid()) = company_id
  );

-- Indexes for performance
CREATE INDEX idx_scheduled_social_posts_company ON public.scheduled_social_posts(company_id);
CREATE INDEX idx_scheduled_social_posts_status ON public.scheduled_social_posts(status);
CREATE INDEX idx_scheduled_social_posts_scheduled_for ON public.scheduled_social_posts(scheduled_for);
CREATE INDEX idx_scheduled_social_posts_batch ON public.scheduled_social_posts(batch_id);

-- Trigger for updated_at
CREATE TRIGGER update_scheduled_social_posts_updated_at
  BEFORE UPDATE ON public.scheduled_social_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();