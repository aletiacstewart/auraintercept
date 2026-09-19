CREATE TABLE public.feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_name text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  rollout_percentage integer NOT NULL DEFAULT 100 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_feature_flags_name_company ON public.feature_flags (flag_name, company_id) WHERE company_id IS NOT NULL;
CREATE UNIQUE INDEX idx_feature_flags_name_global ON public.feature_flags (flag_name) WHERE company_id IS NULL;
CREATE INDEX idx_feature_flags_company ON public.feature_flags (company_id);
CREATE INDEX idx_feature_flags_name ON public.feature_flags (flag_name);

GRANT SELECT ON public.feature_flags TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.feature_flags TO authenticated;
GRANT ALL ON public.feature_flags TO service_role;

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read global and own-company flags"
ON public.feature_flags FOR SELECT TO authenticated
USING (company_id IS NULL OR company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Platform admins manage flags"
ON public.feature_flags FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'platform_admin'))
WITH CHECK (public.has_role(auth.uid(), 'platform_admin'));

CREATE TRIGGER update_feature_flags_updated_at
BEFORE UPDATE ON public.feature_flags
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.feature_flags (flag_name, enabled, rollout_percentage, description) VALUES
  ('unified_analytics_enabled', false, 100, 'New consolidated analytics dashboard'),
  ('new_agent_hub_enabled', false, 100, 'New AI agent management hub'),
  ('first_steps_onboarding_enabled', false, 100, 'New first-steps onboarding checklist'),
  ('industry_specific_paths_enabled', false, 100, 'Industry quick-start paths'),
  ('new_integration_wizard_enabled', false, 100, 'Consolidated integration setup wizard');