
CREATE OR REPLACE FUNCTION public.trigger_auto_dispatch_new_job()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_secret text;
  v_url text := 'https://zwlcwtgjvesbevheknbk.supabase.co/functions/v1/booking-actions';
  v_mode text;
BEGIN
  IF NEW.employee_id IS NOT NULL THEN RETURN NEW; END IF;

  SELECT COALESCE(settings->>'dispatch_mode', 'manual') INTO v_mode
    FROM public.ai_agent_configs
    WHERE company_id = NEW.company_id AND agent_type = 'dispatch' LIMIT 1;
  IF v_mode <> 'auto' AND v_mode <> 'hybrid' THEN RETURN NEW; END IF;

  SELECT secret INTO v_secret FROM public._cron_shared_secret WHERE id = 1;
  IF v_secret IS NULL THEN
    RAISE WARNING 'trigger_auto_dispatch_new_job: cron secret not configured';
    RETURN NEW;
  END IF;

  BEGIN
    PERFORM net.http_post(
      url := v_url,
      headers := jsonb_build_object('Content-Type','application/json','x-cron-secret', v_secret),
      body := jsonb_build_object(
        'action','auto_dispatch',
        'job_assignment_id', NEW.id,
        'appointment_id', NEW.appointment_id,
        'company_id', NEW.company_id
      )
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'trigger_auto_dispatch_new_job failed: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;
