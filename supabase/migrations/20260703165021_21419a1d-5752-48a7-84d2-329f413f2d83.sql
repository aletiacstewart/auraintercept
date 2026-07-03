
-- 1. Internal, locked-down table storing the shared secret used to authenticate
--    inbound cron invocations. Service role only.
CREATE TABLE IF NOT EXISTS public._cron_shared_secret (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  secret text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

REVOKE ALL ON public._cron_shared_secret FROM PUBLIC;
REVOKE ALL ON public._cron_shared_secret FROM anon;
REVOKE ALL ON public._cron_shared_secret FROM authenticated;
GRANT SELECT, INSERT, UPDATE ON public._cron_shared_secret TO service_role;

ALTER TABLE public._cron_shared_secret ENABLE ROW LEVEL SECURITY;
-- No policies = no anon/authenticated access; service_role bypasses RLS.

-- 2. Seed the row (idempotent) and (re-)register all cron jobs with the same
--    secret baked into the x-cron-secret header of net.http_post.
DO $$
DECLARE
  v_secret text;
  v_project_ref text := 'zwlcwtgjvesbevheknbk';
  v_base text;
  v_job record;
  v_cmd text;
  jobs text[][] := ARRAY[
    ['aura-trial-reminders',             '0 9 * * *',           'trial-reminders'],
    ['aura-weekly-digest',               '0 13 * * 1',          'weekly-digest'],
    ['aura-monthly-digest',              '0 14 1 * *',          'monthly-digest'],
    ['aura-quarterly-digest',            '0 15 1 1,4,7,10 *',   'quarterly-digest'],
    ['aura-cost-alerts',                 '0 * * * *',           'cost-alerts'],
    ['aura-cron-health-check',           '*/30 * * * *',        'cron-health-check'],
    ['aura-appointment-reminders',       '*/5 * * * *',         'appointment-reminders'],
    ['aura-lead-follow-up-reminders',    '*/15 * * * *',        'lead-follow-up-reminders']
  ];
BEGIN
  -- Reuse existing secret on re-run so edge-function cache stays valid.
  SELECT secret INTO v_secret FROM public._cron_shared_secret WHERE id = 1;
  IF v_secret IS NULL THEN
    v_secret := encode(gen_random_bytes(32), 'hex');
    INSERT INTO public._cron_shared_secret (id, secret) VALUES (1, v_secret);
  END IF;

  v_base := 'https://' || v_project_ref || '.supabase.co/functions/v1/';

  FOR i IN 1 .. array_length(jobs, 1) LOOP
    -- Unschedule if it exists (ignore errors).
    BEGIN
      PERFORM cron.unschedule(jobs[i][1]);
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;

    v_cmd := format(
      $f$select net.http_post(
        url:=%L,
        headers:=jsonb_build_object(
          'Content-Type', 'application/json',
          'x-cron-secret', %L
        ),
        body:=concat('{"scheduled_at":"', now(), '"}')::jsonb
      ) as request_id;$f$,
      v_base || jobs[i][3],
      v_secret
    );

    PERFORM cron.schedule(jobs[i][1], jobs[i][2], v_cmd);
  END LOOP;
END $$;
