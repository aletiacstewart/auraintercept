-- Deferred onboarding fee tracking for the 60-Day Live Trial billing model.
-- create-checkout records a pending fee when a new subscription starts;
-- charge-onboarding-fee runs daily to invoice fees that reached day 31.
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS onboarding_fee_cents integer,
  ADD COLUMN IF NOT EXISTS onboarding_fee_due_at timestamptz,
  ADD COLUMN IF NOT EXISTS onboarding_fee_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS onboarding_fee_stripe_invoice_id text;

COMMENT ON COLUMN public.companies.onboarding_fee_cents IS 'One-time onboarding fee amount in cents (e.g. 37000 for $370). Null when waived.';
COMMENT ON COLUMN public.companies.onboarding_fee_due_at IS 'When the onboarding fee should be invoiced (trial start + 30 days). Null when waived.';
COMMENT ON COLUMN public.companies.onboarding_fee_status IS 'pending | waived | charged | failed';
COMMENT ON COLUMN public.companies.onboarding_fee_stripe_invoice_id IS 'Stripe invoice ID once the onboarding fee has been invoiced.';

-- Daily cron job to charge pending onboarding fees that are due.
DO $$
DECLARE
  v_secret text;
  v_project_ref text := 'zwlcwtgjvesbevheknbk';
  v_base text;
  v_cmd text;
  v_job_name text := 'aura-charge-onboarding-fee';
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
    v_base || 'charge-onboarding-fee', v_secret
  );
  PERFORM cron.schedule(v_job_name, '0 9 * * *', v_cmd);
END $$;
