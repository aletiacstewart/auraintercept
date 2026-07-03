
-- 1. OAuth state nonces table for CSRF protection on OAuth callbacks
CREATE TABLE IF NOT EXISTS public.oauth_state_nonces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nonce text NOT NULL UNIQUE,
  provider text NOT NULL,
  company_id uuid NOT NULL,
  user_id uuid NOT NULL,
  extra jsonb NOT NULL DEFAULT '{}'::jsonb,
  consumed_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '15 minutes'),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.oauth_state_nonces TO service_role;
ALTER TABLE public.oauth_state_nonces ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS oauth_state_nonces_nonce_idx ON public.oauth_state_nonces(nonce);
CREATE INDEX IF NOT EXISTS oauth_state_nonces_expires_idx ON public.oauth_state_nonces(expires_at);

-- 2. Scope storage policies to authenticated role
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND (policyname ILIKE '%compliance%' OR policyname ILIKE '%call recording%')
  LOOP
    EXECUTE format('ALTER POLICY %I ON storage.objects TO authenticated', r.policyname);
  END LOOP;
END $$;

-- 3. Scope platform_settings policies to authenticated
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'platform_settings'
  LOOP
    EXECUTE format('ALTER POLICY %I ON public.platform_settings TO authenticated', r.policyname);
  END LOOP;
END $$;

-- 4. Replace public read on job-photos with tenant-scoped read
DROP POLICY IF EXISTS "Anyone can view job photos" ON storage.objects;

CREATE POLICY "Tenant members can view job photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'job-photos'
  AND (
    public.has_role(auth.uid(), 'platform_admin'::public.app_role)
    OR (
      (storage.foldername(name))[1] IS NOT NULL
      AND (storage.foldername(name))[1]::uuid = public.get_user_company_id(auth.uid())
    )
  )
);

-- 5. Replace public read on voice-audio with tenant-scoped read
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname ILIKE '%voice%audio%'
  LOOP
    EXECUTE format('DROP POLICY %I ON storage.objects', r.policyname);
  END LOOP;
END $$;

CREATE POLICY "Tenant members can view voice audio"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'voice-audio'
  AND (
    public.has_role(auth.uid(), 'platform_admin'::public.app_role)
    OR (
      (storage.foldername(name))[1] IS NOT NULL
      AND (storage.foldername(name))[1]::uuid = public.get_user_company_id(auth.uid())
    )
  )
);

-- 6. employee_registration_codes: require verified JWT email on claim
DROP POLICY IF EXISTS "Users can mark own registration code as used" ON public.employee_registration_codes;

CREATE POLICY "Users can mark own registration code as used"
ON public.employee_registration_codes
FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND lower(email) = lower(coalesce((auth.jwt() ->> 'email'), ''))
  AND coalesce((auth.jwt() -> 'user_metadata' ->> 'email_verified')::boolean,
               (auth.jwt() ->> 'email_verified')::boolean,
               false) = true
  AND used = false
  AND (expires_at IS NULL OR expires_at > now())
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND lower(email) = lower(coalesce((auth.jwt() ->> 'email'), ''))
);
