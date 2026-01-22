-- Drop existing platform constraint if exists
ALTER TABLE public.social_content_drafts 
  DROP CONSTRAINT IF EXISTS social_content_drafts_platform_check;

-- Add expanded platform constraint (including TikTok and LinkedIn)
ALTER TABLE public.social_content_drafts 
  ADD CONSTRAINT social_content_drafts_platform_check 
  CHECK (platform IN ('instagram', 'google_business', 'facebook', 'sms', 'tiktok', 'linkedin'));

-- Add new columns for enhanced content strategy
ALTER TABLE public.social_content_drafts
  ADD COLUMN IF NOT EXISTS media_instructions TEXT,
  ADD COLUMN IF NOT EXISTS api_metadata JSONB DEFAULT '{}';