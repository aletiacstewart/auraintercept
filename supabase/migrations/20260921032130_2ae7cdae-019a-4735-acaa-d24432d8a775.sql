CREATE TABLE public.workflow_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  workflow_key text NOT NULL,
  title text,
  status text NOT NULL DEFAULT 'running',
  current_step integer NOT NULL DEFAULT 0,
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  attempt_count integer NOT NULL DEFAULT 0,
  next_attempt_at timestamptz DEFAULT now(),
  error_message text,
  escalated_at timestamptz,
  completed_at timestamptz,
  started_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE ON public.workflow_runs TO authenticated;
GRANT ALL ON public.workflow_runs TO service_role;

ALTER TABLE public.workflow_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view their workflow runs"
ON public.workflow_runs FOR SELECT TO authenticated
USING (company_id = public.get_user_company_id(auth.uid()) OR public.has_role(auth.uid(), 'platform_admin'));

CREATE POLICY "Company admins can control their workflow runs"
ON public.workflow_runs FOR UPDATE TO authenticated
USING (
  (company_id = public.get_user_company_id(auth.uid()) AND public.has_company_full_access(auth.uid()))
  OR public.has_role(auth.uid(), 'platform_admin')
)
WITH CHECK (
  (company_id = public.get_user_company_id(auth.uid()) AND public.has_company_full_access(auth.uid()))
  OR public.has_role(auth.uid(), 'platform_admin')
);

CREATE INDEX idx_workflow_runs_company ON public.workflow_runs (company_id, created_at DESC);
CREATE INDEX idx_workflow_runs_due ON public.workflow_runs (next_attempt_at)
  WHERE status IN ('running', 'waiting');

CREATE TRIGGER trg_workflow_runs_updated_at
BEFORE UPDATE ON public.workflow_runs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();