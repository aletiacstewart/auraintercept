
-- ── service_status ─────────────────────────────────────────────────────────
CREATE TABLE public.service_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  component TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'operational'
    CHECK (status IN ('operational', 'degraded', 'down')),
  note TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);

GRANT SELECT ON public.service_status TO anon, authenticated;
GRANT ALL ON public.service_status TO service_role;

ALTER TABLE public.service_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read service status"
  ON public.service_status FOR SELECT USING (true);

CREATE POLICY "Platform admins can insert service status"
  ON public.service_status FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'platform_admin'));

CREATE POLICY "Platform admins can update service status"
  ON public.service_status FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'platform_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'platform_admin'));

CREATE POLICY "Platform admins can delete service status"
  ON public.service_status FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'platform_admin'));

CREATE TRIGGER trg_service_status_updated_at
  BEFORE UPDATE ON public.service_status
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── status_incidents ───────────────────────────────────────────────────────
CREATE TABLE public.status_incidents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL DEFAULT 'minor'
    CHECK (severity IN ('minor', 'major', 'critical')),
  component TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);

CREATE INDEX idx_status_incidents_started_at ON public.status_incidents(started_at DESC);

GRANT SELECT ON public.status_incidents TO anon, authenticated;
GRANT ALL ON public.status_incidents TO service_role;

ALTER TABLE public.status_incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read incidents"
  ON public.status_incidents FOR SELECT USING (true);

CREATE POLICY "Platform admins can insert incidents"
  ON public.status_incidents FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'platform_admin'));

CREATE POLICY "Platform admins can update incidents"
  ON public.status_incidents FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'platform_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'platform_admin'));

CREATE POLICY "Platform admins can delete incidents"
  ON public.status_incidents FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'platform_admin'));

-- ── Seed default components ────────────────────────────────────────────────
INSERT INTO public.service_status (component, display_name, status) VALUES
  ('ai_receptionist', 'AI Receptionist', 'operational'),
  ('booking',         'Booking & Scheduling', 'operational'),
  ('billing',         'Billing & Payments', 'operational'),
  ('sms_email',       'SMS & Email Delivery', 'operational'),
  ('customer_portal', 'Customer Portal', 'operational')
ON CONFLICT (component) DO NOTHING;
