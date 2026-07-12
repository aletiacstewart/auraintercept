DO $$
DECLARE
  legacy_jobs text[] := ARRAY[
    'appointment-reminders-cron',
    'appointment-reminders-job',
    'aura-lead-followup-reminders',
    'check-unsubscribe-alerts-hourly',
    'daily-cost-alerts',
    'daily-trial-reminders',
    'send-weekly-digests-daily'
  ];
  j text;
BEGIN
  FOREACH j IN ARRAY legacy_jobs LOOP
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = j) THEN
      PERFORM cron.unschedule(j);
    END IF;
  END LOOP;
END $$;

DROP TRIGGER IF EXISTS trg_inventory_low_stock ON public.inventory_items;