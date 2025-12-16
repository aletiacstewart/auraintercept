-- Add trial fields to companies table
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS trial_ends_at timestamp with time zone DEFAULT (now() + interval '30 days'),
ADD COLUMN IF NOT EXISTS trial_reminder_7d_sent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS trial_reminder_3d_sent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS trial_reminder_1d_sent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS trial_expired_sent boolean DEFAULT false;

-- Update existing companies to have trial_ends_at based on their created_at
UPDATE public.companies 
SET trial_ends_at = created_at + interval '30 days'
WHERE trial_ends_at IS NULL;