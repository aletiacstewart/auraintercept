CREATE TABLE public.beta_invite_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  label text,
  trial_days integer NOT NULL DEFAULT 60,
  waive_onboarding_fee boolean NOT NULL DEFAULT true,
  max_redemptions integer,
  redemptions_count integer NOT NULL DEFAULT 0,
  expires_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.beta_invite_codes TO authenticated;
GRANT ALL ON public.beta_invite_codes TO service_role;
ALTER TABLE public.beta_invite_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "platform admins manage beta codes"
  ON public.beta_invite_codes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'platform_admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'platform_admin'::public.app_role));

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS beta_trial boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS beta_code text;

CREATE OR REPLACE FUNCTION public.validate_beta_code(p_code text)
RETURNS TABLE(valid boolean, label text, trial_days integer, waive_onboarding_fee boolean, message text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.beta_invite_codes%ROWTYPE;
BEGIN
  SELECT * INTO r FROM public.beta_invite_codes WHERE upper(code) = upper(trim(p_code)) LIMIT 1;
  IF NOT FOUND THEN RETURN QUERY SELECT false, NULL::text, 0, false, 'Invalid invite code'::text; RETURN; END IF;
  IF NOT r.active THEN RETURN QUERY SELECT false, r.label, r.trial_days, r.waive_onboarding_fee, 'This invite code is no longer active'::text; RETURN; END IF;
  IF r.expires_at IS NOT NULL AND r.expires_at < now() THEN RETURN QUERY SELECT false, r.label, r.trial_days, r.waive_onboarding_fee, 'This invite code has expired'::text; RETURN; END IF;
  IF r.max_redemptions IS NOT NULL AND r.redemptions_count >= r.max_redemptions THEN RETURN QUERY SELECT false, r.label, r.trial_days, r.waive_onboarding_fee, 'This invite code has reached its redemption limit'::text; RETURN; END IF;
  RETURN QUERY SELECT true, r.label, r.trial_days, r.waive_onboarding_fee, 'Valid'::text;
END; $$;
GRANT EXECUTE ON FUNCTION public.validate_beta_code(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.redeem_beta_code(p_code text, p_company_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.beta_invite_codes%ROWTYPE;
BEGIN
  SELECT * INTO r FROM public.beta_invite_codes WHERE upper(code) = upper(trim(p_code)) FOR UPDATE;
  IF NOT FOUND OR NOT r.active THEN RETURN false; END IF;
  IF r.expires_at IS NOT NULL AND r.expires_at < now() THEN RETURN false; END IF;
  IF r.max_redemptions IS NOT NULL AND r.redemptions_count >= r.max_redemptions THEN RETURN false; END IF;
  UPDATE public.beta_invite_codes SET redemptions_count = redemptions_count + 1, updated_at = now() WHERE id = r.id;
  UPDATE public.companies
    SET beta_trial = true, beta_code = r.code,
        trial_ends_at = GREATEST(COALESCE(trial_ends_at, now()), now() + (r.trial_days || ' days')::interval),
        updated_at = now()
    WHERE id = p_company_id;
  RETURN true;
END; $$;
REVOKE ALL ON FUNCTION public.redeem_beta_code(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.redeem_beta_code(text, uuid) TO service_role;

INSERT INTO public.beta_invite_codes (code, label, trial_days, waive_onboarding_fee, max_redemptions, active)
VALUES ('BETA-7372424', 'Founding Beta Tester', 60, true, NULL, true)
ON CONFLICT (code) DO NOTHING;