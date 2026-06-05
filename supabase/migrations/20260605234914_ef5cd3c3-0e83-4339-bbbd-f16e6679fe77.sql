CREATE OR REPLACE FUNCTION public.ensure_tenant_integrations_row()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.tenant_integrations (company_id)
  VALUES (NEW.id)
  ON CONFLICT (company_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ensure_tenant_integrations ON public.companies;
CREATE TRIGGER trg_ensure_tenant_integrations
AFTER INSERT ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.ensure_tenant_integrations_row();