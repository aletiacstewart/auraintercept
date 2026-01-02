-- Add CalDAV and sync tracking columns to calendar_event_mappings
ALTER TABLE public.calendar_event_mappings 
ADD COLUMN IF NOT EXISTS caldav_uid text,
ADD COLUMN IF NOT EXISTS caldav_etag text,
ADD COLUMN IF NOT EXISTS sync_source text DEFAULT 'platform',
ADD COLUMN IF NOT EXISTS sync_direction text DEFAULT 'outbound';

-- Create calendar sync jobs table for async processing
CREATE TABLE IF NOT EXISTS public.calendar_sync_jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE CASCADE,
  sync_type text NOT NULL, -- 'google', 'caldav', 'ics'
  operation text NOT NULL, -- 'create', 'update', 'delete'
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  payload jsonb DEFAULT '{}'::jsonb,
  error_message text,
  retry_count integer DEFAULT 0,
  max_retries integer DEFAULT 3,
  scheduled_at timestamp with time zone DEFAULT now(),
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create Google Calendar connections table
CREATE TABLE IF NOT EXISTS public.google_calendar_connections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  access_token text,
  refresh_token text,
  token_expires_at timestamp with time zone,
  calendar_id text DEFAULT 'primary',
  webhook_channel_id text,
  webhook_resource_id text,
  webhook_expiration timestamp with time zone,
  sync_enabled boolean DEFAULT true,
  last_sync_at timestamp with time zone,
  last_error text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(company_id)
);

-- Enable RLS on new tables
ALTER TABLE public.calendar_sync_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_calendar_connections ENABLE ROW LEVEL SECURITY;

-- RLS policies for calendar_sync_jobs
CREATE POLICY "Company admins can manage their sync jobs"
ON public.calendar_sync_jobs
FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND has_role(auth.uid(), 'company_admin'::app_role)
);

CREATE POLICY "Platform admins can view all sync jobs"
ON public.calendar_sync_jobs
FOR SELECT
USING (has_role(auth.uid(), 'platform_admin'::app_role));

-- RLS policies for google_calendar_connections
CREATE POLICY "Company admins can manage their Google Calendar connection"
ON public.google_calendar_connections
FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND has_role(auth.uid(), 'company_admin'::app_role)
);

CREATE POLICY "Platform admins can view all Google Calendar connections"
ON public.google_calendar_connections
FOR SELECT
USING (has_role(auth.uid(), 'platform_admin'::app_role));

-- Create trigger to queue sync jobs when appointments change
CREATE OR REPLACE FUNCTION public.queue_calendar_sync_job()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  operation_type text;
BEGIN
  -- Determine operation type
  IF TG_OP = 'INSERT' THEN
    operation_type := 'create';
  ELSIF TG_OP = 'UPDATE' THEN
    operation_type := 'update';
  ELSIF TG_OP = 'DELETE' THEN
    operation_type := 'delete';
  END IF;

  -- Queue Google Calendar sync if connected
  IF EXISTS (
    SELECT 1 FROM public.google_calendar_connections 
    WHERE company_id = COALESCE(NEW.company_id, OLD.company_id) 
    AND sync_enabled = true
  ) THEN
    INSERT INTO public.calendar_sync_jobs (
      company_id,
      appointment_id,
      sync_type,
      operation,
      payload
    ) VALUES (
      COALESCE(NEW.company_id, OLD.company_id),
      COALESCE(NEW.id, OLD.id),
      'google',
      operation_type,
      jsonb_build_object(
        'appointment', CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE row_to_json(NEW) END
      )
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Calendar sync job queueing failed: %', SQLERRM;
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger on appointments table
DROP TRIGGER IF EXISTS queue_calendar_sync_on_appointment ON public.appointments;
CREATE TRIGGER queue_calendar_sync_on_appointment
AFTER INSERT OR UPDATE OR DELETE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.queue_calendar_sync_job();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_calendar_sync_jobs_status ON public.calendar_sync_jobs(status);
CREATE INDEX IF NOT EXISTS idx_calendar_sync_jobs_company ON public.calendar_sync_jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_google_calendar_connections_company ON public.google_calendar_connections(company_id);