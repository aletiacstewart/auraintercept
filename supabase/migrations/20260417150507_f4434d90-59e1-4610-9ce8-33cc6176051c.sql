DO $$
DECLARE
  c int;
BEGIN
  SELECT COUNT(*) INTO c FROM cron.job WHERE jobname LIKE 'aura-%';
  RAISE NOTICE 'Aura autonomy cron jobs registered: %', c;
END $$;