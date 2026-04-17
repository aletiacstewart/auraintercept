-- Register all autonomy cron jobs idempotently
-- Ensures background loops run without human input
DO $$
DECLARE
  jobs text[][] := ARRAY[
    ['aura-appointment-reminders',     '*/5 * * * *',       'appointment-reminders'],
    ['aura-lead-followup-reminders',   '*/15 * * * *',      'lead-follow-up-reminders'],
    ['aura-check-unsubscribe-alerts',  '0 * * * *',         'check-unsubscribe-alerts'],
    ['aura-trial-reminders',           '0 9 * * *',         'trial-reminders'],
    ['aura-weekly-digest',             '0 13 * * 1',        'weekly-digest'],
    ['aura-monthly-digest',            '0 14 1 * *',        'monthly-digest'],
    ['aura-quarterly-digest',          '0 15 1 1,4,7,10 *', 'quarterly-digest'],
    ['aura-cost-alerts',               '0 * * * *',         'cost-alerts'],
    ['aura-publish-social-content',    '*/5 * * * *',       'publish-social-content'],
    ['aura-generate-blog-batch',       '0 6 * * *',         'generate-blog-batch'],
    ['aura-cron-health-check',         '*/30 * * * *',      'cron-health-check']
  ];
  j text[];
  cmd text;
BEGIN
  FOREACH j SLICE 1 IN ARRAY jobs
  LOOP
    BEGIN
      PERFORM cron.unschedule(j[1]);
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;

    cmd := format(
      $f$select net.http_post(
        url:='https://zwlcwtgjvesbevheknbk.supabase.co/functions/v1/%s',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3bGN3dGdqdmVzYmV2aGVrbmJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MzE5MjIsImV4cCI6MjA4MTMwNzkyMn0.hO2z8Bt_GuPb2-qKuDkjPOp2jlUKaNyzKg6xg5gsa2Y"}'::jsonb,
        body:=concat('{"scheduled_at":"', now(), '"}')::jsonb
      )$f$, j[3]);

    PERFORM cron.schedule(j[1], j[2], cmd);
  END LOOP;
END $$;

-- Read-only RPC so admin UI can list autonomy job status
CREATE OR REPLACE FUNCTION public.get_autonomy_cron_jobs()
RETURNS TABLE(jobname text, schedule text, active boolean, last_run_at timestamptz, last_status text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, cron
AS $$
  SELECT
    j.jobname::text,
    j.schedule::text,
    j.active,
    r.start_time AS last_run_at,
    r.status::text AS last_status
  FROM cron.job j
  LEFT JOIN LATERAL (
    SELECT start_time, status
    FROM cron.job_run_details d
    WHERE d.jobid = j.jobid
    ORDER BY d.start_time DESC
    LIMIT 1
  ) r ON true
  WHERE j.jobname LIKE 'aura-%'
    AND public.has_role(auth.uid(), 'platform_admin'::public.app_role)
  ORDER BY j.jobname;
$$;

REVOKE ALL ON FUNCTION public.get_autonomy_cron_jobs() FROM public;
GRANT EXECUTE ON FUNCTION public.get_autonomy_cron_jobs() TO authenticated;