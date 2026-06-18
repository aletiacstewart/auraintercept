
ALTER TABLE public.companies        ADD COLUMN IF NOT EXISTS profile_key text;
ALTER TABLE public.industry_template_packs ADD COLUMN IF NOT EXISTS profile_key text;

CREATE OR REPLACE FUNCTION public.validate_profile_key()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.profile_key IS NOT NULL
     AND NEW.profile_key NOT IN
       ('PROFILE_A','PROFILE_B','PROFILE_C','PROFILE_D','PROFILE_E',
        'PROFILE_F','PROFILE_G','PROFILE_H','PROFILE_I','PROFILE_J')
  THEN
    RAISE EXCEPTION 'Invalid profile_key: %', NEW.profile_key;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_companies_validate_profile_key ON public.companies;
CREATE TRIGGER trg_companies_validate_profile_key
  BEFORE INSERT OR UPDATE OF profile_key ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.validate_profile_key();

DROP TRIGGER IF EXISTS trg_packs_validate_profile_key ON public.industry_template_packs;
CREATE TRIGGER trg_packs_validate_profile_key
  BEFORE INSERT OR UPDATE OF profile_key ON public.industry_template_packs
  FOR EACH ROW EXECUTE FUNCTION public.validate_profile_key();

-- One-shot backfill for existing companies. New rows from onboarding will
-- write profile_key explicitly from the TS profile map.
UPDATE public.companies SET profile_key = CASE lower(coalesce(industry_vertical,''))
  WHEN 'hvac'                  THEN 'PROFILE_A'
  WHEN 'plumbing'              THEN 'PROFILE_A'
  WHEN 'electrical'            THEN 'PROFILE_A'
  WHEN 'appliance_repair'      THEN 'PROFILE_A'
  WHEN 'handyman'              THEN 'PROFILE_A'
  WHEN 'mobile_mechanic'       THEN 'PROFILE_A'
  WHEN 'landscape'             THEN 'PROFILE_B'
  WHEN 'pool_spa'              THEN 'PROFILE_B'
  WHEN 'pest_control'          THEN 'PROFILE_B'
  WHEN 'roofing'               THEN 'PROFILE_C'
  WHEN 'solar'                 THEN 'PROFILE_C'
  WHEN 'construction'          THEN 'PROFILE_C'
  WHEN 'security_systems'      THEN 'PROFILE_C'
  WHEN 'fencing'               THEN 'PROFILE_C'
  WHEN 'auto_care'             THEN 'PROFILE_G'
  WHEN 'real_estate'           THEN 'PROFILE_E'
  ELSE 'PROFILE_D'
END
WHERE profile_key IS NULL;
