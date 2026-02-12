CREATE OR REPLACE FUNCTION public.list_companies_public()
RETURNS TABLE(id uuid, name text, slug text, logo_url text, primary_color text)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT c.id, c.name, c.slug, c.logo_url, c.primary_color
  FROM companies c
  ORDER BY c.name;
$$;