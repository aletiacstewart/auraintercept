ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS aura_sms_opt_in boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS aura_sms_consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS aura_sms_consent_ip text;

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS aura_sms_opt_in boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS aura_sms_consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS aura_sms_consent_ip text;

COMMENT ON COLUMN public.profiles.aura_sms_opt_in IS 'Explicit user consent (TCPA/10DLC) to receive SMS from Aura Intercept platform. Check before sending any platform-originated SMS.';
COMMENT ON COLUMN public.companies.aura_sms_opt_in IS 'Explicit company consent (TCPA/10DLC) to receive SMS from Aura Intercept platform on the company contact phone.';