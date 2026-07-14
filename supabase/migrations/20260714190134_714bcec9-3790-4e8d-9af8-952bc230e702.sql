
-- 1. Table
CREATE TABLE public.customer_pipeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  customer_profile_id uuid REFERENCES public.customer_profiles(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  stage text NOT NULL DEFAULT 'new',
  stage_changed_at timestamptz NOT NULL DEFAULT now(),
  deal_value_cents integer,
  next_action text,
  next_action_due_at timestamptz,
  last_activity_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_pipeline TO authenticated;
GRANT ALL ON public.customer_pipeline TO service_role;

-- 3. RLS
ALTER TABLE public.customer_pipeline ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members view pipeline"
  ON public.customer_pipeline FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'platform_admin'::public.app_role)
    OR public.get_user_company_id(auth.uid()) = company_id
  );

CREATE POLICY "Company members insert pipeline"
  ON public.customer_pipeline FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'platform_admin'::public.app_role)
    OR public.get_user_company_id(auth.uid()) = company_id
  );

CREATE POLICY "Company members update pipeline"
  ON public.customer_pipeline FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'platform_admin'::public.app_role)
    OR public.get_user_company_id(auth.uid()) = company_id
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'platform_admin'::public.app_role)
    OR public.get_user_company_id(auth.uid()) = company_id
  );

CREATE POLICY "Company members delete pipeline"
  ON public.customer_pipeline FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'platform_admin'::public.app_role)
    OR public.get_user_company_id(auth.uid()) = company_id
  );

-- 4. Indexes
CREATE INDEX idx_customer_pipeline_company_stage
  ON public.customer_pipeline (company_id, stage);
CREATE INDEX idx_customer_pipeline_next_action_due
  ON public.customer_pipeline (company_id, next_action_due_at);
CREATE INDEX idx_customer_pipeline_customer_profile
  ON public.customer_pipeline (company_id, customer_profile_id);
CREATE INDEX idx_customer_pipeline_lead
  ON public.customer_pipeline (company_id, lead_id);

-- 5. Stage validation trigger (using trigger not CHECK per project standard)
CREATE OR REPLACE FUNCTION public.validate_customer_pipeline_stage()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.stage NOT IN ('new','contacted','quoted','won','lost','repeat_customer') THEN
    RAISE EXCEPTION 'Invalid pipeline stage: %', NEW.stage;
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.stage IS DISTINCT FROM OLD.stage THEN
    NEW.stage_changed_at := now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_customer_pipeline_stage_trg
  BEFORE INSERT OR UPDATE ON public.customer_pipeline
  FOR EACH ROW EXECUTE FUNCTION public.validate_customer_pipeline_stage();

-- 6. updated_at trigger (reuse existing helper)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_customer_pipeline_updated_at
  BEFORE UPDATE ON public.customer_pipeline
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
