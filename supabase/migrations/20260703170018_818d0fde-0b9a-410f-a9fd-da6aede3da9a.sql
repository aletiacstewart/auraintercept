
-- 1) Add job_role column to invite codes (nullable — existing rows unaffected)
ALTER TABLE public.employee_registration_codes
  ADD COLUMN IF NOT EXISTS job_role text;

-- 2) Replace validate_registration_code() to match the real schema and return job_role
CREATE OR REPLACE FUNCTION public.validate_registration_code(p_code text, p_company_id uuid DEFAULT NULL)
RETURNS TABLE (
  is_valid boolean,
  company_id uuid,
  company_name text,
  job_role text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rec RECORD;
BEGIN
  SELECT
    erc.company_id  AS company_id,
    erc.expires_at  AS expires_at,
    erc.used        AS used,
    erc.job_role    AS job_role,
    c.name          AS company_name
  INTO v_rec
  FROM public.employee_registration_codes erc
  JOIN public.companies c ON c.id = erc.company_id
  WHERE erc.code = p_code
    AND (p_company_id IS NULL OR erc.company_id = p_company_id)
  LIMIT 1;

  IF v_rec IS NULL THEN
    RETURN QUERY SELECT false, NULL::uuid, NULL::text, NULL::text;
    RETURN;
  END IF;

  IF v_rec.used THEN
    RETURN QUERY SELECT false, NULL::uuid, NULL::text, NULL::text;
    RETURN;
  END IF;

  IF v_rec.expires_at IS NOT NULL AND v_rec.expires_at < now() THEN
    RETURN QUERY SELECT false, NULL::uuid, NULL::text, NULL::text;
    RETURN;
  END IF;

  RETURN QUERY SELECT true, v_rec.company_id, v_rec.company_name, v_rec.job_role;
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_registration_code(text, uuid) TO anon, authenticated;
