-- Fix: Appointments table public exposure
-- The current "Anyone can view appointment by token" policy is too permissive
-- It allows viewing ALL appointments that have a token, not just the one with the matching token

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view appointment by token" ON public.appointments;

-- The token-based access should be handled via edge functions, not direct table access
-- Edge functions can validate the token and return only the matching appointment
-- For now, we don't add a replacement public SELECT policy

-- Note: The existing policies already properly restrict access:
-- - Company admins can view all company appointments (via company_id match)
-- - Customers can view their own appointments (via customer_user_id match)
-- - Employees can view their own appointments (via employee_id match)
-- - Platform admins can view all appointments