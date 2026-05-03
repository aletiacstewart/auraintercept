-- Auto-seed services from industry pack on company creation/industry change

CREATE OR REPLACE FUNCTION public.seed_industry_pack_services_for_company(p_company_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_pack public.industry_template_packs%ROWTYPE;
  v_svc jsonb;
  v_name text;
  v_existing_count int;
BEGIN
  SELECT itp.*
    INTO v_pack
  FROM public.companies c
  JOIN public.industry_template_packs itp
    ON itp.industry_id = c.industry_vertical
   AND itp.is_active = true
  WHERE c.id = p_company_id
  LIMIT 1;

  IF NOT FOUND THEN RETURN; END IF;

  SELECT count(*) INTO v_existing_count
  FROM public.services WHERE company_id = p_company_id;
  IF v_existing_count > 0 THEN RETURN; END IF;

  IF v_pack.service_catalog IS NULL
     OR jsonb_typeof(v_pack.service_catalog) <> 'array' THEN
    RETURN;
  END IF;

  FOR v_svc IN SELECT * FROM jsonb_array_elements(v_pack.service_catalog) LOOP
    v_name := COALESCE(v_svc->>'name', '');
    IF length(trim(v_name)) = 0 THEN CONTINUE; END IF;
    INSERT INTO public.services (
      company_id, name, category, duration_minutes, service_type, is_active
    ) VALUES (
      p_company_id, v_name,
      NULLIF(v_svc->>'category',''),
      NULLIF(v_svc->>'default_duration_minutes','')::int,
      COALESCE(NULLIF(v_svc->>'default_service_type',''), 'in_person'),
      true
    );
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_seed_industry_pack_kb()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.industry_vertical IS NOT NULL
     AND NEW.industry_vertical IS DISTINCT FROM COALESCE(OLD.industry_vertical, '') THEN
    PERFORM public.seed_industry_pack_kb_for_company(NEW.id);
    PERFORM public.seed_industry_pack_services_for_company(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

-- Backfill existing companies
DO $$
DECLARE c_rec RECORD;
BEGIN
  FOR c_rec IN
    SELECT c.id FROM public.companies c
    JOIN public.industry_template_packs itp
      ON itp.industry_id = c.industry_vertical AND itp.is_active = true
    WHERE c.industry_vertical IS NOT NULL
      AND jsonb_typeof(itp.service_catalog) = 'array'
      AND jsonb_array_length(itp.service_catalog) > 0
      AND NOT EXISTS (SELECT 1 FROM public.services s WHERE s.company_id = c.id)
  LOOP
    PERFORM public.seed_industry_pack_services_for_company(c_rec.id);
  END LOOP;
END $$;
