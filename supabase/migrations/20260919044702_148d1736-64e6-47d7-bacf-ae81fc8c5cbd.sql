ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_progress integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS onboarding_skipped_at timestamptz,
  ADD COLUMN IF NOT EXISTS first_steps_state jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.industry_template_packs
  ADD COLUMN IF NOT EXISTS quickstart jsonb NOT NULL DEFAULT '{}'::jsonb;