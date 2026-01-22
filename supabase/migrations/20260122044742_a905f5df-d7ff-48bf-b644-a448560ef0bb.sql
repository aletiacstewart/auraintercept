-- Create enum for social platforms (if not exists, extend it)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'social_platform') THEN
    CREATE TYPE public.social_platform AS ENUM ('facebook', 'instagram', 'linkedin', 'tiktok', 'google_business');
  END IF;
END $$;

-- Create enum for scheduled post status
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'scheduled_post_status') THEN
    CREATE TYPE public.scheduled_post_status AS ENUM ('draft', 'scheduled', 'publishing', 'published', 'failed', 'cancelled');
  END IF;
END $$;

-- ============================================
-- Table: social_accounts
-- Stores OAuth tokens for each social platform per company
-- ============================================
CREATE TABLE public.social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  platform public.social_platform NOT NULL,
  
  -- OAuth tokens (stored securely)
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Platform-specific identifiers
  platform_account_id TEXT NOT NULL,
  platform_account_name TEXT,
  platform_page_id TEXT,
  
  -- Connection metadata
  connected_by UUID REFERENCES public.profiles(id),
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  last_error TEXT,
  is_active BOOLEAN DEFAULT true,
  
  -- Permissions granted during OAuth
  permissions_granted TEXT[],
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Unique constraint: one account per platform per company
  UNIQUE(company_id, platform, platform_account_id)
);

-- Enable RLS
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for social_accounts
CREATE POLICY "Company members can view social accounts"
  ON public.social_accounts FOR SELECT
  USING (public.can_view_company(company_id));

CREATE POLICY "Company admins can insert social accounts"
  ON public.social_accounts FOR INSERT
  WITH CHECK (
    public.has_company_full_access(auth.uid()) 
    AND public.get_user_company_id(auth.uid()) = company_id
  );

CREATE POLICY "Company admins can update social accounts"
  ON public.social_accounts FOR UPDATE
  USING (
    public.has_company_full_access(auth.uid()) 
    AND public.get_user_company_id(auth.uid()) = company_id
  );

CREATE POLICY "Company admins can delete social accounts"
  ON public.social_accounts FOR DELETE
  USING (
    public.has_company_full_access(auth.uid()) 
    AND public.get_user_company_id(auth.uid()) = company_id
  );

-- Index for quick lookups
CREATE INDEX idx_social_accounts_company_platform ON public.social_accounts(company_id, platform);

-- ============================================
-- Table: scheduled_posts
-- Queue for timed publishing across platforms
-- ============================================
CREATE TABLE public.scheduled_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- Link to original draft (optional)
  draft_id UUID REFERENCES public.social_content_drafts(id) ON DELETE SET NULL,
  
  -- Content to publish
  content_json JSONB NOT NULL,
  
  -- Scheduling
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  timezone TEXT DEFAULT 'America/New_York',
  
  -- Multi-platform targeting
  platforms TEXT[] NOT NULL,
  
  -- Status tracking
  status public.scheduled_post_status DEFAULT 'draft',
  
  -- Publish results per platform
  publish_results JSONB DEFAULT '{}',
  
  -- Error handling
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  last_error TEXT,
  
  -- Audit
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  published_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scheduled_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for scheduled_posts
CREATE POLICY "Company members can view scheduled posts"
  ON public.scheduled_posts FOR SELECT
  USING (public.can_view_company(company_id));

CREATE POLICY "Marketing access can insert scheduled posts"
  ON public.scheduled_posts FOR INSERT
  WITH CHECK (
    public.has_marketing_access(auth.uid()) 
    AND public.get_user_company_id(auth.uid()) = company_id
  );

CREATE POLICY "Marketing access can update scheduled posts"
  ON public.scheduled_posts FOR UPDATE
  USING (
    public.has_marketing_access(auth.uid()) 
    AND public.get_user_company_id(auth.uid()) = company_id
  );

CREATE POLICY "Marketing access can delete scheduled posts"
  ON public.scheduled_posts FOR DELETE
  USING (
    public.has_marketing_access(auth.uid()) 
    AND public.get_user_company_id(auth.uid()) = company_id
  );

-- Index for cron job queries (find posts due for publishing)
CREATE INDEX idx_scheduled_posts_pending ON public.scheduled_posts(scheduled_for, status) 
  WHERE status = 'scheduled';

CREATE INDEX idx_scheduled_posts_company ON public.scheduled_posts(company_id, status);

-- ============================================
-- Extend social_content_drafts with publish tracking
-- ============================================
ALTER TABLE public.social_content_drafts
  ADD COLUMN IF NOT EXISTS external_post_id TEXT,
  ADD COLUMN IF NOT EXISTS external_post_url TEXT,
  ADD COLUMN IF NOT EXISTS scheduled_post_id UUID REFERENCES public.scheduled_posts(id) ON DELETE SET NULL;

-- ============================================
-- Triggers for updated_at
-- ============================================
CREATE TRIGGER update_social_accounts_updated_at
  BEFORE UPDATE ON public.social_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scheduled_posts_updated_at
  BEFORE UPDATE ON public.scheduled_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();