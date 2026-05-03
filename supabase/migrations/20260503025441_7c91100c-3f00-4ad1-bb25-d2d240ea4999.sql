-- Auto-sync companies.operating_model from industry_blueprints whenever
-- industry_vertical changes. This ensures the new OperationsRouter renders the
-- correct console (field_dispatch / appointment_booking / pipeline_sales /
-- receptionist_only) immediately after signup or industry change, with no
-- client-side mapping needed.

CREATE OR REPLACE FUNCTION public.sync_operating_model_from_blueprint()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_model text;
BEGIN
  IF NEW.industry_vertical IS NULL THEN
    RETURN NEW;
  END IF;

  -- Only resolve if industry changed OR operating_model is empty
  IF (TG_OP = 'INSERT')
     OR (NEW.industry_vertical IS DISTINCT FROM OLD.industry_vertical)
     OR (NEW.operating_model IS NULL) THEN
    SELECT operating_model INTO v_model
    FROM public.industry_blueprints
    WHERE slug = NEW.industry_vertical AND is_active = true
    LIMIT 1;

    IF v_model IS NOT NULL THEN
      NEW.operating_model := v_model;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_operating_model ON public.companies;
CREATE TRIGGER trg_sync_operating_model
  BEFORE INSERT OR UPDATE OF industry_vertical ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_operating_model_from_blueprint();

-- Backfill any existing rows that have an industry but no/stale operating_model
UPDATE public.companies c
SET operating_model = bp.operating_model
FROM public.industry_blueprints bp
WHERE c.industry_vertical = bp.slug
  AND bp.is_active = true
  AND (c.operating_model IS NULL OR c.operating_model IS DISTINCT FROM bp.operating_model);