-- Add unsubscribe alert settings to companies
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS unsubscribe_alert_threshold integer DEFAULT 10,
ADD COLUMN IF NOT EXISTS unsubscribe_alert_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS unsubscribe_alert_email text,
ADD COLUMN IF NOT EXISTS last_unsubscribe_alert_at timestamp with time zone;

-- Create table to track sent alerts (prevent duplicate alerts)
CREATE TABLE public.unsubscribe_alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  period_start timestamp with time zone NOT NULL,
  period_end timestamp with time zone NOT NULL,
  unsubscribe_count integer NOT NULL,
  threshold integer NOT NULL,
  sent_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.unsubscribe_alerts ENABLE ROW LEVEL SECURITY;

-- Company admins can view their alerts
CREATE POLICY "Company admins can view unsubscribe alerts"
  ON public.unsubscribe_alerts
  FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()) AND has_role(auth.uid(), 'company_admin'));

-- Platform admins can view all
CREATE POLICY "Platform admins can view all unsubscribe alerts"
  ON public.unsubscribe_alerts
  FOR SELECT
  USING (has_role(auth.uid(), 'platform_admin'));

CREATE INDEX idx_unsubscribe_alerts_company_id ON public.unsubscribe_alerts(company_id);
CREATE INDEX idx_unsubscribe_alerts_sent_at ON public.unsubscribe_alerts(sent_at DESC);