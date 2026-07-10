
CREATE TABLE IF NOT EXISTS public.company_setup_step_overrides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  step_id TEXT NOT NULL,
  completed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, step_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_setup_step_overrides TO authenticated;
GRANT ALL ON public.company_setup_step_overrides TO service_role;

ALTER TABLE public.company_setup_step_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view their own setup overrides"
  ON public.company_setup_step_overrides
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'platform_admin')
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.company_id = company_setup_step_overrides.company_id
    )
  );

CREATE POLICY "Company admins can manage their own setup overrides"
  ON public.company_setup_step_overrides
  FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'platform_admin')
    OR (
      public.has_role(auth.uid(), 'company_admin')
      AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.company_id = company_setup_step_overrides.company_id
      )
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'platform_admin')
    OR (
      public.has_role(auth.uid(), 'company_admin')
      AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.company_id = company_setup_step_overrides.company_id
      )
    )
  );

CREATE TRIGGER update_company_setup_step_overrides_updated_at
  BEFORE UPDATE ON public.company_setup_step_overrides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
