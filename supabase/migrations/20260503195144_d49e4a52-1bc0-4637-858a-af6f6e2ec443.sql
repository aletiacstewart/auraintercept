-- 1) Fix Security Definer View linter ERROR
ALTER VIEW public.tenant_integrations_safe SET (security_invoker = on);

-- 2) Backfill service_catalog for packs where it is empty,
--    deriving starter services from quote_template line_items.
CREATE OR REPLACE FUNCTION public.backfill_service_catalog_defaults()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pack RECORD;
  v_services jsonb;
  v_updated integer := 0;
BEGIN
  FOR v_pack IN
    SELECT id, industry_id, quote_template
    FROM public.industry_template_packs
    WHERE COALESCE(jsonb_array_length(service_catalog), 0) = 0
  LOOP
    -- Build service entries from quote_template.line_items if available
    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'name', li->>'description',
          'description', li->>'description',
          'base_price', COALESCE((li->>'unit_price')::numeric, 0),
          'est_duration_min', 60,
          'taxable', COALESCE((li->>'taxable')::boolean, true)
        )
      ),
      '[]'::jsonb
    )
    INTO v_services
    FROM jsonb_array_elements(COALESCE(v_pack.quote_template->'line_items', '[]'::jsonb)) li
    WHERE li->>'description' IS NOT NULL;

    -- If still empty, seed a single generic "Service Call" entry so pickers aren't blank
    IF jsonb_array_length(v_services) = 0 THEN
      v_services := jsonb_build_array(
        jsonb_build_object(
          'name', 'Service Call',
          'description', 'Standard service visit',
          'base_price', 0,
          'est_duration_min', 60,
          'taxable', true
        )
      );
    END IF;

    UPDATE public.industry_template_packs
    SET service_catalog = v_services,
        updated_at = now()
    WHERE id = v_pack.id;

    v_updated := v_updated + 1;
  END LOOP;

  RETURN v_updated;
END;
$$;

-- Run it once during this migration
SELECT public.backfill_service_catalog_defaults();