-- Add onboarding tracking columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz,
ADD COLUMN IF NOT EXISTS tours_completed jsonb DEFAULT '{}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.onboarding_completed_at IS 'Timestamp when user completed initial onboarding';
COMMENT ON COLUMN public.profiles.tours_completed IS 'JSON object tracking which tours/guides the user has seen';