-- Add calendar feed tokens for ICS calendar subscription
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS calendar_feed_token uuid DEFAULT gen_random_uuid();

ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS calendar_feed_token uuid DEFAULT gen_random_uuid();

-- Add index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_profiles_calendar_feed_token ON public.profiles(calendar_feed_token);
CREATE INDEX IF NOT EXISTS idx_companies_calendar_feed_token ON public.companies(calendar_feed_token);