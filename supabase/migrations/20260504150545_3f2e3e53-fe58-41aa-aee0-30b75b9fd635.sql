DROP TRIGGER IF EXISTS trg_auto_set_healthcare_compliance ON public.companies;
DROP FUNCTION IF EXISTS public.fn_auto_set_healthcare_compliance();
ALTER TABLE public.companies DROP COLUMN IF EXISTS healthcare_compliance;