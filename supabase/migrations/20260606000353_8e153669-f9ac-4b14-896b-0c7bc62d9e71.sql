-- 1. One-time cleanup: delete forbidden legacy agent configs
DELETE FROM public.ai_agent_configs
WHERE agent_type IN ('warranty', 'crm', 'booking_legacy', 'lead_legacy');

-- 2. Prevent re-introducing forbidden agent types
ALTER TABLE public.ai_agent_configs
  DROP CONSTRAINT IF EXISTS chk_agent_type_not_legacy;
ALTER TABLE public.ai_agent_configs
  ADD CONSTRAINT chk_agent_type_not_legacy
  CHECK (agent_type NOT IN ('warranty', 'crm', 'booking_legacy', 'lead_legacy'));

-- 3. New google_calendar_connections rows must have a refresh_token
-- (existing NULL rows kept as-is so we don't break stale data; new inserts/updates validated by trigger)
CREATE OR REPLACE FUNCTION public.validate_gcal_refresh_token()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.refresh_token IS NULL OR length(trim(NEW.refresh_token)) = 0 THEN
    RAISE EXCEPTION 'google_calendar_connections.refresh_token is required (company_id=%)', NEW.company_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_gcal_refresh_token ON public.google_calendar_connections;
CREATE TRIGGER trg_validate_gcal_refresh_token
BEFORE INSERT ON public.google_calendar_connections
FOR EACH ROW EXECUTE FUNCTION public.validate_gcal_refresh_token();

-- 4. REVOKE anon on newer sensitive tables (missed by earlier sweep)
REVOKE ALL ON public.campaign_sends FROM anon;
REVOKE ALL ON public.push_subscriptions FROM anon;
REVOKE ALL ON public.staff_notifications FROM anon;
REVOKE ALL ON public.staff_notification_preferences FROM anon;