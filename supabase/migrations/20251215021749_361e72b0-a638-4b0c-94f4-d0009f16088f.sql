-- Drop the restrictive policy and create a simpler one
DROP POLICY IF EXISTS "Authenticated users can create their first company" ON public.companies;

-- Allow any authenticated user to insert a company (they'll only do this during signup)
CREATE POLICY "Authenticated users can create a company"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (true);