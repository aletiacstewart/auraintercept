
DROP POLICY IF EXISTS "Users can mark own registration code as used" ON public.employee_registration_codes;

CREATE POLICY "Users can mark own registration code as used"
ON public.employee_registration_codes
FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND (auth.jwt() ->> 'email') IS NOT NULL
  AND lower(email) = lower(auth.jwt() ->> 'email')
  AND used = false
  AND (expires_at IS NULL OR expires_at > now())
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (auth.jwt() ->> 'email') IS NOT NULL
  AND lower(email) = lower(auth.jwt() ->> 'email')
);
