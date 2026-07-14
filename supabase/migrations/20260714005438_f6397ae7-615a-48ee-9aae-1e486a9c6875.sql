
-- Part A1: payment recovery status + dunning tracking + cancellation feedback on companies
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'current',
  ADD COLUMN IF NOT EXISTS payment_failed_at timestamptz,
  ADD COLUMN IF NOT EXISTS grace_period_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS dunning_reminders_sent integer[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS cancellation_reason text,
  ADD COLUMN IF NOT EXISTS cancellation_feedback text;

DO $$
BEGIN
  ALTER TABLE public.companies
    ADD CONSTRAINT companies_payment_status_check
    CHECK (payment_status IN ('current','past_due','canceled','suspended'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_companies_payment_status ON public.companies(payment_status);

COMMENT ON COLUMN public.companies.payment_status IS 'current | past_due | canceled | suspended — set by stripe-webhook + dunning-reminder-scan';
COMMENT ON COLUMN public.companies.dunning_reminders_sent IS 'Day-marks (0,3,6) already emailed while past_due. Reset when payment recovers.';

-- Part B1: referrals table
CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referring_company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  referral_code text NOT NULL UNIQUE,
  referred_email text,
  referred_company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','signed_up','converted','rewarded')),
  created_at timestamptz NOT NULL DEFAULT now(),
  converted_at timestamptz,
  rewarded_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_referrals_referring_company ON public.referrals(referring_company_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_company ON public.referrals(referred_company_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON public.referrals(referral_code);

GRANT SELECT, INSERT, UPDATE ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Company admins view own referrals" ON public.referrals;
CREATE POLICY "Company admins view own referrals" ON public.referrals
  FOR SELECT TO authenticated
  USING (
    referring_company_id = public.get_user_company_id(auth.uid())
    OR public.has_role(auth.uid(), 'platform_admin')
  );

DROP POLICY IF EXISTS "Company admins insert own referrals" ON public.referrals;
CREATE POLICY "Company admins insert own referrals" ON public.referrals
  FOR INSERT TO authenticated
  WITH CHECK (
    referring_company_id = public.get_user_company_id(auth.uid())
    OR public.has_role(auth.uid(), 'platform_admin')
  );

DROP POLICY IF EXISTS "Platform admin manages referrals" ON public.referrals;
CREATE POLICY "Platform admin manages referrals" ON public.referrals
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'platform_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'platform_admin'));

-- get_or_create_referral_code: idempotent single-code-per-company
CREATE OR REPLACE FUNCTION public.get_or_create_referral_code(p_company_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code text;
  v_attempt int := 0;
BEGIN
  SELECT referral_code INTO v_code
    FROM public.referrals
   WHERE referring_company_id = p_company_id
   ORDER BY created_at ASC
   LIMIT 1;

  IF v_code IS NOT NULL THEN
    RETURN v_code;
  END IF;

  LOOP
    v_attempt := v_attempt + 1;
    v_code := encode(gen_random_bytes(4), 'hex'); -- 8 chars
    BEGIN
      INSERT INTO public.referrals (referring_company_id, referral_code, status)
      VALUES (p_company_id, v_code, 'pending');
      RETURN v_code;
    EXCEPTION WHEN unique_violation THEN
      IF v_attempt > 5 THEN RAISE; END IF;
    END;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_or_create_referral_code(uuid) TO authenticated;

-- Register aura-dunning-reminders daily cron
DO $$
DECLARE
  v_secret text;
  v_project_ref text := 'zwlcwtgjvesbevheknbk';
  v_base text;
  v_cmd text;
  v_job_name text := 'aura-dunning-reminders';
BEGIN
  SELECT secret INTO v_secret FROM public._cron_shared_secret WHERE id = 1;
  IF v_secret IS NULL THEN
    v_secret := encode(gen_random_bytes(32), 'hex');
    INSERT INTO public._cron_shared_secret (id, secret) VALUES (1, v_secret);
  END IF;

  v_base := 'https://' || v_project_ref || '.supabase.co/functions/v1/';

  BEGIN PERFORM cron.unschedule(v_job_name); EXCEPTION WHEN OTHERS THEN NULL; END;
  v_cmd := format(
    $f$select net.http_post(
      url:=%L,
      headers:=jsonb_build_object('Content-Type','application/json','x-cron-secret',%L),
      body:=concat('{"scheduled_at":"', now(), '"}')::jsonb
    ) as request_id;$f$,
    v_base || 'dunning-reminder-scan', v_secret
  );
  PERFORM cron.schedule(v_job_name, '0 10 * * *', v_cmd);
END $$;
