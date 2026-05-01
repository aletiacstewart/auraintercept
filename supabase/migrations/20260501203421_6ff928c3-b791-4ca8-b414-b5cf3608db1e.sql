CREATE OR REPLACE FUNCTION public.get_public_industry_pack(p_company_id uuid)
RETURNS TABLE(
  industry_id text,
  label text,
  job_templates jsonb,
  form_schemas jsonb,
  terminology jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    itp.industry_id,
    itp.label,
    itp.job_templates,
    itp.form_schemas,
    itp.terminology
  FROM public.companies c
  JOIN public.industry_template_packs itp
    ON itp.industry_id = c.industry_vertical
   AND itp.is_active = true
  WHERE c.id = p_company_id
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_industry_pack(uuid) TO anon, authenticated;