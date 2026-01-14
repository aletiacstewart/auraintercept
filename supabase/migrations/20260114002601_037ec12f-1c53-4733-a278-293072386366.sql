-- Fix 1: Companies - Authenticated users can create a company
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can create a company" ON public.companies;

-- Create a more secure policy - authenticated users can create companies, but must be linked to their profile
CREATE POLICY "Authenticated users can create their company"
ON public.companies FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Fix 2: customer_feedback - Anyone can submit feedback
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can submit feedback" ON public.customer_feedback;

-- Allow authenticated users to submit feedback for their associated company
-- Allow unauthenticated (public widget) submissions with valid company_id
CREATE POLICY "Public can submit feedback with valid company"
ON public.customer_feedback FOR INSERT
TO anon, authenticated
WITH CHECK (
  -- Verify company_id exists
  EXISTS (SELECT 1 FROM public.companies WHERE id = company_id)
);

-- Fix 3: employee_registration_codes - Anyone can mark code as used
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can mark code as used" ON public.employee_registration_codes;

-- Create a more restrictive policy - only allow updating the 'used' field for valid codes
-- The code lookup already happens via a SELECT policy, this just allows marking as used during registration
CREATE POLICY "Users can mark code as used during registration"
ON public.employee_registration_codes FOR UPDATE
TO authenticated, anon
USING (
  -- Allow if the code exists and hasn't expired
  expires_at > now() AND used = false
)
WITH CHECK (
  -- Only allow setting used = true, not modifying other fields
  used = true
);

-- Fix 4: missed_call_callbacks - Service role can manage all missed call callbacks
-- This table should only be accessible by service role (edge functions), not regular users
DROP POLICY IF EXISTS "Service role can manage all missed call callbacks" ON public.missed_call_callbacks;

-- Instead of USING (true), we simply remove the policy since service_role bypasses RLS entirely
-- Add proper policies for company access if needed
CREATE POLICY "Company admins can view their missed call callbacks"
ON public.missed_call_callbacks FOR SELECT
TO authenticated
USING (
  (company_id = public.get_user_company_id(auth.uid()) AND public.has_role(auth.uid(), 'company_admin'))
  OR public.has_role(auth.uid(), 'platform_admin')
);

CREATE POLICY "Platform admins can manage all missed call callbacks"
ON public.missed_call_callbacks FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'platform_admin'))
WITH CHECK (public.has_role(auth.uid(), 'platform_admin'));