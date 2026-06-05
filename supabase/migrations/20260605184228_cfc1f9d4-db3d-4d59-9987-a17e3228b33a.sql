ALTER TABLE public.companies
  ALTER COLUMN trial_ends_at SET DEFAULT (now() + interval '60 days');

UPDATE public.companies
SET trial_ends_at = created_at + interval '60 days'
WHERE trial_ends_at IS NOT NULL
  AND trial_ends_at > now()
  AND trial_ends_at > created_at + interval '60 days';