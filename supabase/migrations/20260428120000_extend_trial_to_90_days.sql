-- Extend free trial from 30 days to 90 days
-- 1. Update default for new signups
ALTER TABLE public.companies
  ALTER COLUMN trial_ends_at SET DEFAULT (now() + interval '90 days');

-- 2. Extend existing active trials by 60 days
-- Only extend trials that haven't expired yet (still in their original 30-day window)
UPDATE public.companies
SET trial_ends_at = trial_ends_at + interval '60 days'
WHERE trial_ends_at IS NOT NULL
  AND trial_ends_at > now();
