-- Pass 1: DB security hardening (narrow, low-risk)
-- storage.buckets already has RLS enabled with no policies — anon listing is already blocked.
-- This migration revokes EXECUTE from PUBLIC/anon/authenticated on internal trigger-only or postgres-only functions.

-- Trigger functions (called by table triggers, not directly by clients)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_company_signup_notify() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ensure_job_assignment_for_appointment() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ensure_tenant_integrations_row() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.backfill_service_catalog_defaults() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_company_registration_code() FROM PUBLIC, anon, authenticated;

-- Explicitly lock storage.buckets against any future accidental grants by adding an explicit deny-all policy for anon/authenticated.
-- (RLS is already enabled with no policies, which denies by default; this is defense-in-depth.)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='buckets' AND policyname='deny_bucket_listing_from_clients'
  ) THEN
    CREATE POLICY deny_bucket_listing_from_clients ON storage.buckets
      AS RESTRICTIVE FOR SELECT TO anon, authenticated
      USING (false);
  END IF;
END $$;