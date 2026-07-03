DO $$
DECLARE
  v_secret text;
  v_project_ref text := 'zwlcwtgjvesbevheknbk';
  v_url text := 'https://' || v_project_ref || '.supabase.co/functions/v1/ai-orchestrator';
  v_cmd text;
BEGIN
  SELECT secret INTO v_secret FROM public._cron_shared_secret WHERE id = 1;
  IF v_secret IS NULL THEN
    RAISE EXCEPTION 'shared cron secret missing; run the base cron migration first';
  END IF;

  BEGIN
    PERFORM cron.unschedule('aura-process-pending-agent-events');
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  v_cmd := format(
    $f$select net.http_post(
      url:=%L,
      headers:=jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', %L
      ),
      body:='{"action":"process_pending_events"}'::jsonb
    ) as request_id;$f$,
    v_url, v_secret
  );

  PERFORM cron.schedule('aura-process-pending-agent-events', '*/2 * * * *', v_cmd);
END $$;