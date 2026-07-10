-- Cron jobs
DO $$
DECLARE
  v_secret text;
  v_project_ref text := 'zwlcwtgjvesbevheknbk';
  v_base text;
  v_cmd text;
  jobs text[][] := ARRAY[
    ['aura-winback-scan',                '0 8 * * *',      'winback-scan'],
    ['aura-google-cal-inbound-sync',     '*/30 * * * *',   'google-calendar-inbound-sync'],
    ['aura-campaign-series-dispatch',    '*/5 * * * *',    'campaign-series-dispatch'],
    ['aura-integration-health-check',    '0 6 * * *',      'integration-health-check'],
    ['aura-orchestrator-proposals',      '*/15 * * * *',   'orchestrator-proposals'],
    ['aura-analytics-weekly-run',        '0 9 * * 1',      'analytics-weekly-run']
  ];
BEGIN
  SELECT secret INTO v_secret FROM public._cron_shared_secret WHERE id = 1;
  IF v_secret IS NULL THEN
    v_secret := encode(gen_random_bytes(32), 'hex');
    INSERT INTO public._cron_shared_secret (id, secret) VALUES (1, v_secret);
  END IF;

  v_base := 'https://' || v_project_ref || '.supabase.co/functions/v1/';

  FOR i IN 1 .. array_length(jobs, 1) LOOP
    BEGIN PERFORM cron.unschedule(jobs[i][1]); EXCEPTION WHEN OTHERS THEN NULL; END;
    v_cmd := format(
      $f$select net.http_post(
        url:=%L,
        headers:=jsonb_build_object('Content-Type','application/json','x-cron-secret',%L),
        body:=concat('{"scheduled_at":"', now(), '"}')::jsonb
      ) as request_id;$f$,
      v_base || jobs[i][3], v_secret
    );
    PERFORM cron.schedule(jobs[i][1], jobs[i][2], v_cmd);
  END LOOP;
END $$;

-- Auto-dispatch on new job
CREATE OR REPLACE FUNCTION public.trigger_auto_dispatch_new_job()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_anon text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3bGN3dGdqdmVzYmV2aGVrbmJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MzE5MjIsImV4cCI6MjA4MTMwNzkyMn0.hO2z8Bt_GuPb2-qKuDkjPOp2jlUKaNyzKg6xg5gsa2Y';
  v_url text := 'https://zwlcwtgjvesbevheknbk.supabase.co/functions/v1/booking-actions';
  v_mode text;
BEGIN
  IF NEW.employee_id IS NOT NULL THEN RETURN NEW; END IF;
  SELECT COALESCE(settings->>'dispatch_mode', 'manual') INTO v_mode
    FROM public.ai_agent_configs
    WHERE company_id = NEW.company_id AND agent_type = 'dispatch' LIMIT 1;
  IF v_mode <> 'auto' AND v_mode <> 'hybrid' THEN RETURN NEW; END IF;

  BEGIN
    PERFORM net.http_post(
      url := v_url,
      headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||v_anon,'apikey',v_anon),
      body := jsonb_build_object('action','auto_dispatch','job_assignment_id',NEW.id,'appointment_id',NEW.appointment_id,'company_id',NEW.company_id)
    );
  EXCEPTION WHEN OTHERS THEN RAISE WARNING 'trigger_auto_dispatch_new_job failed: %', SQLERRM;
  END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_dispatch_new_job ON public.job_assignments;
CREATE TRIGGER trg_auto_dispatch_new_job
AFTER INSERT ON public.job_assignments
FOR EACH ROW EXECUTE FUNCTION public.trigger_auto_dispatch_new_job();

-- Low-stock alert
CREATE OR REPLACE FUNCTION public.trigger_inventory_low_stock_alert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.min_quantity IS NULL OR NEW.quantity IS NULL THEN RETURN NEW; END IF;
  IF NEW.quantity <= NEW.min_quantity
     AND (TG_OP = 'INSERT' OR OLD.quantity IS NULL OR OLD.quantity > NEW.min_quantity) THEN
    BEGIN
      INSERT INTO public.staff_notifications (company_id, recipient_role, notification_type, title, message, metadata)
      VALUES (
        NEW.company_id, 'company_admin', 'inventory_low_stock',
        'Low stock: ' || COALESCE(NEW.name, 'inventory item'),
        'On hand: ' || NEW.quantity || ' · reorder point: ' || NEW.min_quantity,
        jsonb_build_object('inventory_item_id', NEW.id, 'sku', NEW.sku)
      );
    EXCEPTION WHEN OTHERS THEN RAISE WARNING 'low_stock_alert insert failed: %', SQLERRM;
    END;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_inventory_low_stock_alert ON public.inventory_items;
CREATE TRIGGER trg_inventory_low_stock_alert
AFTER INSERT OR UPDATE OF quantity, min_quantity ON public.inventory_items
FOR EACH ROW EXECUTE FUNCTION public.trigger_inventory_low_stock_alert();

-- Employee welcome
CREATE OR REPLACE FUNCTION public.trigger_employee_welcome_on_profile()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_anon text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3bGN3dGdqdmVzYmV2aGVrbmJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MzE5MjIsImV4cCI6MjA4MTMwNzkyMn0.hO2z8Bt_GuPb2-qKuDkjPOp2jlUKaNyzKg6xg5gsa2Y';
  v_url text := 'https://zwlcwtgjvesbevheknbk.supabase.co/functions/v1/send-company-welcome';
BEGIN
  IF NEW.company_id IS NULL THEN RETURN NEW; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.id AND role = 'employee') THEN
    RETURN NEW;
  END IF;
  BEGIN
    PERFORM net.http_post(
      url := v_url,
      headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||v_anon,'apikey',v_anon),
      body := jsonb_build_object('kind','employee','user_id',NEW.id,'company_id',NEW.company_id,'email',NEW.email,'name',NEW.full_name)
    );
  EXCEPTION WHEN OTHERS THEN RAISE WARNING 'employee_welcome failed: %', SQLERRM;
  END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_employee_welcome_on_profile ON public.profiles;
CREATE TRIGGER trg_employee_welcome_on_profile
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.trigger_employee_welcome_on_profile();

-- KB refresh on services / faqs
CREATE OR REPLACE FUNCTION public.trigger_kb_refresh()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_anon text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3bGN3dGdqdmVzYmV2aGVrbmJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MzE5MjIsImV4cCI6MjA4MTMwNzkyMn0.hO2z8Bt_GuPb2-qKuDkjPOp2jlUKaNyzKg6xg5gsa2Y';
  v_url text := 'https://zwlcwtgjvesbevheknbk.supabase.co/functions/v1/generate-knowledge-base';
  v_company uuid := COALESCE(NEW.company_id, OLD.company_id);
BEGIN
  IF v_company IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;
  BEGIN
    PERFORM net.http_post(
      url := v_url,
      headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||v_anon,'apikey',v_anon),
      body := jsonb_build_object('company_id', v_company, 'source', 'auto_refresh')
    );
  EXCEPTION WHEN OTHERS THEN RAISE WARNING 'kb_refresh failed: %', SQLERRM;
  END;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_kb_refresh_services ON public.services;
CREATE TRIGGER trg_kb_refresh_services
AFTER INSERT OR UPDATE OR DELETE ON public.services
FOR EACH ROW EXECUTE FUNCTION public.trigger_kb_refresh();

DROP TRIGGER IF EXISTS trg_kb_refresh_faqs ON public.faqs;
CREATE TRIGGER trg_kb_refresh_faqs
AFTER INSERT OR UPDATE OR DELETE ON public.faqs
FOR EACH ROW EXECUTE FUNCTION public.trigger_kb_refresh();
