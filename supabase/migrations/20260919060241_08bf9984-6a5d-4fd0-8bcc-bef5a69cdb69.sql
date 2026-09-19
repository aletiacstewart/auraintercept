CREATE TABLE public.integration_health_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  integration_name text NOT NULL,
  status text NOT NULL CHECK (status IN ('connected','degraded','error','not_configured')),
  last_sync timestamptz,
  error_message text,
  success_rate numeric,
  checked_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.integration_health_logs TO authenticated;
GRANT ALL ON public.integration_health_logs TO service_role;

ALTER TABLE public.integration_health_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view their integration health"
  ON public.integration_health_logs
  FOR SELECT
  TO authenticated
  USING (
    company_id = public.get_user_company_id(auth.uid())
    OR public.has_role(auth.uid(), 'platform_admin')
  );

CREATE INDEX idx_integration_health_logs_company_name_time
  ON public.integration_health_logs (company_id, integration_name, checked_at DESC);