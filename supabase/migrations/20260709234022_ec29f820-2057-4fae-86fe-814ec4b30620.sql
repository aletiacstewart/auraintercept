-- ============================================================
-- Automation quick wins: 3 new cron jobs + 1 completion trigger
-- ============================================================

-- 1. Register three new cron jobs alongside the existing aura-* set.
--    Reuses the shared _cron_shared_secret row seeded by the base cron migration.
DO $$
DECLARE
  v_secret text;
  v_project_ref text := 'zwlcwtgjvesbevheknbk';
  v_base text;
  v_cmd text;
  jobs text[][] := ARRAY[
    ['aura-crm-sync-leads',        '0 */4 * * *',   'crm-sync-leads'],
    ['aura-generate-social-batch', '0 7 * * 1',     'generate-social-batch'],
    ['aura-missed-call-retry',     '*/10 * * * *',  'missed-call-retry']
  ];
BEGIN
  SELECT secret INTO v_secret FROM public._cron_shared_secret WHERE id = 1;
  IF v_secret IS NULL THEN
    v_secret := encode(gen_random_bytes(32), 'hex');
    INSERT INTO public._cron_shared_secret (id, secret) VALUES (1, v_secret);
  END IF;

  v_base := 'https://' || v_project_ref || '.supabase.co/functions/v1/';

  FOR i IN 1 .. array_length(jobs, 1) LOOP
    BEGIN
      PERFORM cron.unschedule(jobs[i][1]);
    EXCEPTION WHEN OTHERS THEN NULL;
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

-- 2. Trigger: when a job assignment flips to 'completed', fire the
--    review-request edge function. Failure NEVER blocks the DML.
CREATE OR REPLACE FUNCTION public.trigger_review_request_on_job_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_url  text := 'https://zwlcwtgjvesbevheknbk.supabase.co/functions/v1/send-review-request';
  v_anon text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3bGN3dGdqdmVzYmV2aGVrbmJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MzE5MjIsImV4cCI6MjA4MTMwNzkyMn0.hO2z8Bt_GuPb2-qKuDkjPOp2jlUKaNyzKg6xg5gsa2Y';
BEGIN
  BEGIN
    PERFORM net.http_post(
      url := v_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_anon,
        'apikey', v_anon
      ),
      body := jsonb_build_object('jobAssignmentId', NEW.id)
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'trigger_review_request_on_job_completion http_post failed: %', SQLERRM;
  END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_review_request_on_job_completion ON public.job_assignments;

CREATE TRIGGER trg_review_request_on_job_completion
AFTER UPDATE OF status ON public.job_assignments
FOR EACH ROW
WHEN (NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed')
EXECUTE FUNCTION public.trigger_review_request_on_job_completion();