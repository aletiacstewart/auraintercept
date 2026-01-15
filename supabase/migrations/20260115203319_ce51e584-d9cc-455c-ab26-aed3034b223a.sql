-- Add subscription_tier column to companies table
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free' 
CHECK (subscription_tier IN ('free', 'single_point', 'multi_track', 'command'));

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_companies_subscription_tier ON public.companies(subscription_tier);

-- Add comment for documentation
COMMENT ON COLUMN public.companies.subscription_tier IS 'Subscription tier: free, single_point ($497/mo), multi_track ($897/mo), command ($1497/mo)';