-- Public RPC to fetch office hours for a published Smart Website
CREATE OR REPLACE FUNCTION public.get_website_public_hours(p_subdomain text)
RETURNS TABLE (
  day_of_week int,
  open_time text,
  close_time text,
  is_closed boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id uuid;
BEGIN
  -- Resolve company from published website
  SELECT sw.company_id
    INTO v_company_id
  FROM public.smart_websites sw
  WHERE sw.subdomain = p_subdomain
    AND sw.is_published = true
  LIMIT 1;

  IF v_company_id IS NULL THEN
    -- Match existing UX: return empty set for not found/unpublished
    RETURN;
  END IF;

  RETURN QUERY
  SELECT bh.day_of_week,
         bh.open_time::text,
         bh.close_time::text,
         bh.is_closed
  FROM public.business_hours bh
  WHERE bh.company_id = v_company_id
    AND bh.hour_type = 'office'
  ORDER BY bh.day_of_week;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_website_public_hours(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_website_public_hours(text) TO authenticated;