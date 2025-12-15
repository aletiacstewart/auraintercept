-- Allow authenticated users to insert their own company during signup
CREATE POLICY "Authenticated users can create their first company"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (
  NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND company_id IS NOT NULL
  )
);

-- Allow authenticated users to insert their own role during signup
CREATE POLICY "Authenticated users can insert their own role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());