-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Authenticated users can create a company" ON public.companies;

-- Create a PERMISSIVE policy that allows authenticated users to insert companies
CREATE POLICY "Authenticated users can create a company"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (true);