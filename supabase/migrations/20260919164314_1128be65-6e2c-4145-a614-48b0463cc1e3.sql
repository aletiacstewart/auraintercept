CREATE TABLE public.onboarding_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN (
    'onboarding_started',
    'onboarding_step_completed',
    'onboarding_step_skipped',
    'onboarding_finished',
    'first_booking_created',
    'first_quote_created',
    'first_agent_enabled',
    'integration_connected'
  )),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_onboarding_analytics_company_event
  ON public.onboarding_analytics(company_id, event_type, created_at DESC);
CREATE INDEX idx_onboarding_analytics_user_created
  ON public.onboarding_analytics(user_id, created_at DESC);

GRANT SELECT, INSERT ON public.onboarding_analytics TO authenticated;
GRANT ALL ON public.onboarding_analytics TO service_role;

ALTER TABLE public.onboarding_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View own company onboarding analytics"
  ON public.onboarding_analytics
  FOR SELECT
  TO authenticated
  USING (
    company_id = public.get_user_company_id(auth.uid())
    OR public.has_role(auth.uid(), 'platform_admin')
  );

CREATE POLICY "Insert own onboarding analytics"
  ON public.onboarding_analytics
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (
      company_id = public.get_user_company_id(auth.uid())
      OR public.has_role(auth.uid(), 'platform_admin')
    )
  );