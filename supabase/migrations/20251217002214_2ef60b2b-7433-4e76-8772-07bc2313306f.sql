-- Enable pg_net extension for HTTP calls from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create function to sync appointment to Google Calendar
CREATE OR REPLACE FUNCTION public.sync_appointment_to_google_calendar()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  supabase_url text;
  service_role_key text;
  payload jsonb;
  action_type text;
BEGIN
  -- Get Supabase URL from environment (will be set via vault)
  supabase_url := current_setting('app.settings.supabase_url', true);
  service_role_key := current_setting('app.settings.service_role_key', true);
  
  -- If settings not available, skip (will be handled by manual trigger later)
  IF supabase_url IS NULL OR service_role_key IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Determine action type
  IF TG_OP = 'DELETE' THEN
    action_type := 'delete_event';
    payload := jsonb_build_object(
      'action', action_type,
      'companyId', OLD.company_id,
      'appointmentId', OLD.id
    );
  ELSIF TG_OP = 'INSERT' THEN
    action_type := 'sync_appointment';
    payload := jsonb_build_object(
      'action', action_type,
      'companyId', NEW.company_id,
      'appointmentId', NEW.id,
      'appointment', row_to_json(NEW)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    -- Only sync if relevant fields changed
    IF NEW.datetime IS DISTINCT FROM OLD.datetime OR
       NEW.customer_name IS DISTINCT FROM OLD.customer_name OR
       NEW.customer_address IS DISTINCT FROM OLD.customer_address OR
       NEW.service_type IS DISTINCT FROM OLD.service_type OR
       NEW.duration_minutes IS DISTINCT FROM OLD.duration_minutes OR
       NEW.status IS DISTINCT FROM OLD.status OR
       NEW.notes IS DISTINCT FROM OLD.notes THEN
      
      -- If status changed to cancelled, delete the event
      IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
        action_type := 'delete_event';
        payload := jsonb_build_object(
          'action', action_type,
          'companyId', NEW.company_id,
          'appointmentId', NEW.id
        );
      ELSE
        action_type := 'sync_appointment';
        payload := jsonb_build_object(
          'action', action_type,
          'companyId', NEW.company_id,
          'appointmentId', NEW.id,
          'appointment', row_to_json(NEW)
        );
      END IF;
    ELSE
      -- No relevant changes, skip
      RETURN NEW;
    END IF;
  END IF;

  -- Make async HTTP call to edge function via pg_net
  PERFORM extensions.http_post(
    url := supabase_url || '/functions/v1/google-calendar-sync',
    body := payload::text,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    )::jsonb
  );

  RETURN COALESCE(NEW, OLD);
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the appointment operation
    RAISE WARNING 'Google Calendar sync failed: %', SQLERRM;
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for appointments
DROP TRIGGER IF EXISTS trigger_sync_appointment_to_google ON public.appointments;
CREATE TRIGGER trigger_sync_appointment_to_google
  AFTER INSERT OR UPDATE OR DELETE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_appointment_to_google_calendar();