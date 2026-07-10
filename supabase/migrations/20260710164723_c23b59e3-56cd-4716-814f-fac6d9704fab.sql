
-- Slice A cleanup: remove duplicate cron jobs and duplicate inventory trigger

SELECT cron.unschedule('appointment-reminders-cron');
SELECT cron.unschedule('appointment-reminders-job');
SELECT cron.unschedule('aura-lead-followup-reminders');
SELECT cron.unschedule('check-unsubscribe-alerts-hourly');
SELECT cron.unschedule('daily-cost-alerts');
SELECT cron.unschedule('daily-trial-reminders');
SELECT cron.unschedule('send-weekly-digests-daily');

DROP TRIGGER IF EXISTS trg_inventory_low_stock ON public.inventory_items;
