
CREATE OR REPLACE FUNCTION public.trg_sync_company_workspace()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND
     NEW.industry_vertical IS NOT DISTINCT FROM OLD.industry_vertical AND
     NEW.subscription_tier IS NOT DISTINCT FROM OLD.subscription_tier AND
     NEW.industry_config IS NOT DISTINCT FROM OLD.industry_config THEN
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := 'https://zwlcwtgjvesbevheknbk.supabase.co/functions/v1/sync-company-workspace',
    body := jsonb_build_object('company_id', NEW.id),
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3bGN3dGdqdmVzYmV2aGVrbmJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MzE5MjIsImV4cCI6MjA4MTMwNzkyMn0.hO2z8Bt_GuPb2-qKuDkjPOp2jlUKaNyzKg6xg5gsa2Y"}'::jsonb
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'sync-company-workspace dispatch failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_company_workspace ON public.companies;
CREATE TRIGGER trg_sync_company_workspace
AFTER INSERT OR UPDATE OF industry_vertical, subscription_tier, industry_config
ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.trg_sync_company_workspace();
