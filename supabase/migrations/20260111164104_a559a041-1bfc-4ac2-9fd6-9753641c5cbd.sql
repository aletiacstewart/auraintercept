-- Fix the overly permissive customer_profiles RLS policy
-- The current policy "Customers can view own profile via token" allows SELECT when portal_token IS NOT NULL
-- This exposes all customer data. Replace with proper authenticated access.

-- Drop the insecure policy
DROP POLICY IF EXISTS "Customers can view own profile via token" ON public.customer_profiles;

-- Create a secure policy that requires authentication and proper association
CREATE POLICY "Customers can view own profile authenticated" 
ON public.customer_profiles 
FOR SELECT
USING (
  -- Customers can view profiles linked to their authenticated account
  id IN (
    SELECT cca.customer_profile_id 
    FROM customer_company_associations cca 
    WHERE cca.customer_user_id = auth.uid()
  )
  OR 
  -- Allow company admins and employees to view profiles in their company
  company_id = get_user_company_id(auth.uid())
  OR 
  -- Platform admins can view all
  has_role(auth.uid(), 'platform_admin'::app_role)
);