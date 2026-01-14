-- Create warranty policies function with correct column names
CREATE OR REPLACE FUNCTION public.get_company_warranty_policies(p_company_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  duration_months integer,
  duration_text text,
  coverage_type text,
  coverage_details text,
  terms_conditions text,
  exclusions text,
  labor_covered boolean,
  parts_covered boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    name,
    description,
    duration_months,
    duration_text,
    coverage_type,
    coverage_details,
    terms_conditions,
    exclusions,
    labor_covered,
    parts_covered
  FROM warranty_policies
  WHERE company_id = p_company_id
    AND is_active = true
  ORDER BY sort_order, name;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_company_warranty_policies(uuid) TO anon, authenticated;