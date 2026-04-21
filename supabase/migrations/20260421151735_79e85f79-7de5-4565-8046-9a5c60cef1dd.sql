ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferred_language text NOT NULL DEFAULT 'en';

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_preferred_language_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_preferred_language_check
  CHECK (preferred_language IN ('en','es'));

ALTER TABLE public.customer_profiles
  ADD COLUMN IF NOT EXISTS preferred_language text NOT NULL DEFAULT 'en';

ALTER TABLE public.customer_profiles
  DROP CONSTRAINT IF EXISTS customer_profiles_preferred_language_check;

ALTER TABLE public.customer_profiles
  ADD CONSTRAINT customer_profiles_preferred_language_check
  CHECK (preferred_language IN ('en','es'));

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS elevenlabs_voice_id_es text;