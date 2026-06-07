DROP FUNCTION IF EXISTS public.validate_beta_code(text);

CREATE OR REPLACE FUNCTION public.validate_beta_code(p_code text)
RETURNS TABLE(valid boolean, label text, trial_days integer, waive_onboarding_fee boolean, onboarding_fee_cap_cents integer, onboarding_cap_expires_at timestamptz, message text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.beta_invite_codes%ROWTYPE;
BEGIN
  SELECT * INTO r FROM public.beta_invite_codes WHERE upper(code) = upper(trim(p_code)) LIMIT 1;
  IF NOT FOUND THEN RETURN QUERY SELECT false, NULL::text, 0, false, NULL::integer, NULL::timestamptz, 'Invalid invite code'::text; RETURN; END IF;
  IF NOT r.active THEN RETURN QUERY SELECT false, r.label, r.trial_days, r.waive_onboarding_fee, r.onboarding_fee_cap_cents, r.onboarding_cap_expires_at, 'This invite code is no longer active'::text; RETURN; END IF;
  IF r.expires_at IS NOT NULL AND r.expires_at < now() THEN RETURN QUERY SELECT false, r.label, r.trial_days, r.waive_onboarding_fee, r.onboarding_fee_cap_cents, r.onboarding_cap_expires_at, 'This invite code has expired'::text; RETURN; END IF;
  IF r.max_redemptions IS NOT NULL AND r.redemptions_count >= r.max_redemptions THEN RETURN QUERY SELECT false, r.label, r.trial_days, r.waive_onboarding_fee, r.onboarding_fee_cap_cents, r.onboarding_cap_expires_at, 'This invite code has reached its redemption limit'::text; RETURN; END IF;
  RETURN QUERY SELECT true, r.label, r.trial_days, r.waive_onboarding_fee, r.onboarding_fee_cap_cents, r.onboarding_cap_expires_at, 'Valid'::text;
END; $$;
GRANT EXECUTE ON FUNCTION public.validate_beta_code(text) TO anon, authenticated;