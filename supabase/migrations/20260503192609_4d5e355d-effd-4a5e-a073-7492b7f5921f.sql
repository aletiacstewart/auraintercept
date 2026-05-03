
CREATE TABLE public.onboarding_step_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid,
  step text NOT NULL,
  action text NOT NULL CHECK (action IN ('view','complete','skip','launch')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_onboarding_events_company_created
  ON public.onboarding_step_events(company_id, created_at DESC);
CREATE INDEX idx_onboarding_events_step
  ON public.onboarding_step_events(step, action);

ALTER TABLE public.onboarding_step_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can record their own onboarding events"
  ON public.onboarding_step_events FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (company_id IS NULL OR company_id = public.get_user_company_id(auth.uid()))
  );

CREATE POLICY "Users can read their company onboarding events"
  ON public.onboarding_step_events FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'platform_admin'::public.app_role)
    OR (company_id IS NOT NULL AND company_id = public.get_user_company_id(auth.uid()))
  );
