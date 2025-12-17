-- Add Google Calendar columns to tenant_integrations
ALTER TABLE public.tenant_integrations
ADD COLUMN IF NOT EXISTS google_calendar_id text,
ADD COLUMN IF NOT EXISTS google_calendar_enabled boolean DEFAULT false;

-- Create table for mapping appointments to Google Calendar events
CREATE TABLE IF NOT EXISTS public.calendar_event_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  google_event_id text NOT NULL,
  last_synced_at timestamp with time zone DEFAULT now(),
  sync_status text DEFAULT 'synced',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(appointment_id)
);

-- Enable RLS
ALTER TABLE public.calendar_event_mappings ENABLE ROW LEVEL SECURITY;

-- RLS policies for calendar_event_mappings
CREATE POLICY "Company admins can manage their calendar mappings"
ON public.calendar_event_mappings FOR ALL
USING (company_id = get_user_company_id(auth.uid()) AND has_role(auth.uid(), 'company_admin'::app_role));

CREATE POLICY "Platform admins can view all calendar mappings"
ON public.calendar_event_mappings FOR SELECT
USING (has_role(auth.uid(), 'platform_admin'::app_role));

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_calendar_event_mappings_appointment ON public.calendar_event_mappings(appointment_id);
CREATE INDEX IF NOT EXISTS idx_calendar_event_mappings_google_event ON public.calendar_event_mappings(google_event_id);

-- Trigger for updated_at
CREATE TRIGGER update_calendar_event_mappings_updated_at
BEFORE UPDATE ON public.calendar_event_mappings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();