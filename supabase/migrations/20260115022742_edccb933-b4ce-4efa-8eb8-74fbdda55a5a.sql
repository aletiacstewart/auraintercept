-- Fix: warranty_records has RLS enabled but no policies.
-- Add least-privilege policies using existing SECURITY DEFINER helpers (has_role, get_user_company_id).

-- Ensure RLS is enabled (idempotent)
ALTER TABLE public.warranty_records ENABLE ROW LEVEL SECURITY;

-- Company admins can manage warranty records for their own company
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'warranty_records'
      AND policyname = 'Company admins manage warranty records'
  ) THEN
    CREATE POLICY "Company admins manage warranty records"
    ON public.warranty_records
    FOR ALL
    USING (
      public.has_role(auth.uid(), 'company_admin'::public.app_role)
      AND public.get_user_company_id(auth.uid()) = company_id
    )
    WITH CHECK (
      public.has_role(auth.uid(), 'company_admin'::public.app_role)
      AND public.get_user_company_id(auth.uid()) = company_id
    );
  END IF;
END $$;

-- Employees (including technicians) can view warranty records for their own company
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'warranty_records'
      AND policyname = 'Company members view warranty records'
  ) THEN
    CREATE POLICY "Company members view warranty records"
    ON public.warranty_records
    FOR SELECT
    USING (
      public.get_user_company_id(auth.uid()) = company_id
    );
  END IF;
END $$;

-- Platform admins can view all warranty records
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'warranty_records'
      AND policyname = 'Platform admins view all warranty records'
  ) THEN
    CREATE POLICY "Platform admins view all warranty records"
    ON public.warranty_records
    FOR SELECT
    USING (
      public.has_role(auth.uid(), 'platform_admin'::public.app_role)
    );
  END IF;
END $$;

-- Optional hardening: revoke any accidental grants; keep PostgREST access controlled by RLS.
REVOKE ALL ON public.warranty_records FROM anon;
REVOKE ALL ON public.warranty_records FROM authenticated;