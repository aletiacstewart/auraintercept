-- 1. Fix role privilege escalation: drop overly permissive INSERT policy
DROP POLICY IF EXISTS "Authenticated users can insert their own role" ON public.user_roles;

-- Add restricted self-serve policy (only for customer role)
CREATE POLICY "Users can self-register as customers only"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND role = 'customer');

-- 2. Fix registration codes exposure: drop broad SELECT policy
DROP POLICY IF EXISTS "authenticated_users_can_validate_codes" ON public.employee_registration_codes;

-- 3. Fix appointment token exposure: drop overly permissive public read policy
DROP POLICY IF EXISTS "Anyone can view appointment by token" ON public.appointments;

-- 4. Fix issue-screenshots storage: make bucket private
UPDATE storage.buckets SET public = false WHERE id = 'issue-screenshots';

-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Anyone can view issue screenshots" ON storage.objects;

-- Add scoped policies for authenticated users
CREATE POLICY "Users can view their own issue screenshots"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'issue-screenshots'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Platform admins can view all issue screenshots"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'issue-screenshots'
    AND public.has_role(auth.uid(), 'platform_admin'::public.app_role)
  );