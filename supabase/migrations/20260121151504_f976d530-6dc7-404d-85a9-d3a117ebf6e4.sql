-- Fix ambiguous column reference in get_company_calendar_appointments
CREATE OR REPLACE FUNCTION public.get_company_calendar_appointments(p_feed_token UUID)
RETURNS TABLE (
  id UUID,
  datetime TIMESTAMPTZ,
  duration_minutes INT,
  service_type TEXT,
  status TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  customer_address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  company_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id UUID;
  v_company_name TEXT;
BEGIN
  -- FIX: Qualify column references with table alias to avoid ambiguity
  SELECT c.id, c.name INTO v_company_id, v_company_name
  FROM public.companies c
  WHERE c.calendar_feed_token = p_feed_token;
  
  IF v_company_id IS NULL THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    a.id,
    a.datetime,
    a.duration_minutes,
    a.service_type,
    a.status,
    a.customer_name,
    a.customer_phone,
    a.customer_email,
    a.customer_address,
    a.notes,
    a.created_at,
    a.updated_at,
    v_company_name as company_name
  FROM public.appointments a
  WHERE a.company_id = v_company_id
    AND a.status != 'cancelled'
    AND a.datetime >= NOW() - INTERVAL '30 days'
  ORDER BY a.datetime;
END;
$$;