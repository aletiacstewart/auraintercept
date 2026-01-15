-- Create appointment by token RPC with proper type casting
CREATE FUNCTION public.get_appointment_by_token(p_token text)
RETURNS TABLE (
  id uuid,
  customer_name text,
  service_type text,
  datetime timestamptz,
  duration_minutes integer,
  status text,
  customer_address text,
  notes text,
  company_id uuid,
  company_name text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    a.id,
    a.customer_name,
    a.service_type,
    a.datetime,
    a.duration_minutes,
    a.status,
    a.customer_address,
    a.notes,
    a.company_id,
    c.name as company_name
  FROM public.appointments a
  JOIN public.companies c ON c.id = a.company_id
  WHERE a.customer_token = p_token::uuid
    AND a.created_at > (now() - interval '90 days')
    AND a.status NOT IN ('cancelled', 'no_show')
  ORDER BY a.datetime DESC
  LIMIT 10;
$$;

-- Create registration code validation RPC
CREATE FUNCTION public.validate_registration_code(p_code text, p_company_id uuid DEFAULT NULL)
RETURNS TABLE (
  is_valid boolean,
  company_id uuid,
  company_name text,
  job_role text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code_record RECORD;
BEGIN
  SELECT 
    erc.id,
    erc.company_id,
    erc.job_role,
    erc.expires_at,
    erc.max_uses,
    erc.current_uses,
    c.name as company_name
  INTO v_code_record
  FROM public.employee_registration_codes erc
  JOIN public.companies c ON c.id = erc.company_id
  WHERE erc.code = p_code
    AND (p_company_id IS NULL OR erc.company_id = p_company_id);
  
  IF v_code_record IS NULL THEN
    RETURN QUERY SELECT false::boolean, NULL::uuid, NULL::text, NULL::text;
    RETURN;
  END IF;
  
  IF v_code_record.expires_at IS NOT NULL AND v_code_record.expires_at < now() THEN
    RETURN QUERY SELECT false::boolean, NULL::uuid, NULL::text, NULL::text;
    RETURN;
  END IF;
  
  IF v_code_record.max_uses IS NOT NULL AND v_code_record.current_uses >= v_code_record.max_uses THEN
    RETURN QUERY SELECT false::boolean, NULL::uuid, NULL::text, NULL::text;
    RETURN;
  END IF;
  
  RETURN QUERY SELECT 
    true::boolean,
    v_code_record.company_id,
    v_code_record.company_name,
    v_code_record.job_role;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_appointment_by_token(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_registration_code(text, uuid) TO anon, authenticated;