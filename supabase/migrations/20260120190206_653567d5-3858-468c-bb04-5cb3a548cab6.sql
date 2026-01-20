-- ================================================
-- PRE-LAUNCH SECURITY FIX: Tighten Registration Codes
-- ================================================

-- Fix employee_registration_codes - only authenticated users can validate
DROP POLICY IF EXISTS "Anyone can validate a code" ON public.employee_registration_codes;
DROP POLICY IF EXISTS "Anyone can mark code as used" ON public.employee_registration_codes;

CREATE POLICY "authenticated_users_can_validate_codes"
  ON public.employee_registration_codes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "authenticated_users_can_use_codes"
  ON public.employee_registration_codes FOR UPDATE
  TO authenticated
  USING (used = false)
  WITH CHECK (used = true);