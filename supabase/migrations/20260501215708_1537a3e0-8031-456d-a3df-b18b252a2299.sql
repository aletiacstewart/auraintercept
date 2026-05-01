CREATE OR REPLACE FUNCTION public.submit_public_booking(
  p_company_id uuid,
  p_name text,
  p_phone text,
  p_email text DEFAULT NULL,
  p_address text DEFAULT NULL,
  p_service_interest text DEFAULT NULL,
  p_preferred_datetime timestamptz DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_intake_data jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead_id uuid;
  v_combined_notes text;
BEGIN
  -- Validate required fields
  IF p_company_id IS NULL THEN
    RAISE EXCEPTION 'company_id is required';
  END IF;
  IF p_name IS NULL OR length(trim(p_name)) = 0 THEN
    RAISE EXCEPTION 'name is required';
  END IF;
  IF p_phone IS NULL OR length(trim(p_phone)) = 0 THEN
    RAISE EXCEPTION 'phone is required';
  END IF;

  -- Verify company exists (rejects spam to random UUIDs)
  IF NOT EXISTS (SELECT 1 FROM public.companies WHERE id = p_company_id) THEN
    RAISE EXCEPTION 'company not found';
  END IF;

  v_combined_notes := COALESCE(p_notes, '');
  IF p_preferred_datetime IS NOT NULL THEN
    v_combined_notes :=
      'Requested time: ' || to_char(p_preferred_datetime AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI UTC')
      || CASE WHEN length(v_combined_notes) > 0 THEN E'\n\n' || v_combined_notes ELSE '' END;
  END IF;

  INSERT INTO public.leads (
    company_id, name, email, phone, address,
    source, intent, service_interest, notes, intake_data, status
  ) VALUES (
    p_company_id,
    trim(p_name),
    NULLIF(trim(p_email), ''),
    trim(p_phone),
    NULLIF(trim(p_address), ''),
    'public_booking',
    'booking',
    NULLIF(trim(p_service_interest), ''),
    NULLIF(v_combined_notes, ''),
    COALESCE(p_intake_data, '{}'::jsonb),
    'new'
  )
  RETURNING id INTO v_lead_id;

  RETURN v_lead_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.submit_public_booking(uuid, text, text, text, text, text, timestamptz, text, jsonb) FROM public;
GRANT  EXECUTE ON FUNCTION public.submit_public_booking(uuid, text, text, text, text, text, timestamptz, text, jsonb) TO anon, authenticated;
