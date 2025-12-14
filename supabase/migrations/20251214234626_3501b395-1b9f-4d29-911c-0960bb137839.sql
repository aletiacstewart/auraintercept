-- Create subscription events table to track opt-in/opt-out
CREATE TABLE public.subscription_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('sms', 'email', 'call')),
  action text NOT NULL CHECK (action IN ('subscribe', 'unsubscribe')),
  source text NOT NULL DEFAULT 'customer_portal' CHECK (source IN ('customer_portal', 'email_link', 'admin', 'booking')),
  customer_email text,
  customer_phone text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;

-- Company admins can view their subscription events
CREATE POLICY "Company admins can view subscription events"
  ON public.subscription_events
  FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()) AND has_role(auth.uid(), 'company_admin'));

-- Platform admins can view all
CREATE POLICY "Platform admins can view all subscription events"
  ON public.subscription_events
  FOR SELECT
  USING (has_role(auth.uid(), 'platform_admin'));

-- Create index for efficient querying
CREATE INDEX idx_subscription_events_company_id ON public.subscription_events(company_id);
CREATE INDEX idx_subscription_events_created_at ON public.subscription_events(created_at DESC);