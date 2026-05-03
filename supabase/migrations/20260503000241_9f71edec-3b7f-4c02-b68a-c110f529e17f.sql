
-- 1. Bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('compliance-docs', 'compliance-docs', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Enums
DO $$ BEGIN
  CREATE TYPE public.compliance_doc_type AS ENUM ('dba', 'ein', 'formation', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.compliance_doc_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Table
CREATE TABLE IF NOT EXISTS public.company_compliance_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  uploaded_by uuid,
  file_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text,
  size_bytes bigint,
  doc_type public.compliance_doc_type NOT NULL DEFAULT 'other',
  status public.compliance_doc_status NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_compliance_docs_company ON public.company_compliance_documents(company_id);

ALTER TABLE public.company_compliance_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company admins view own compliance docs"
  ON public.company_compliance_documents FOR SELECT
  USING (
    public.has_role(auth.uid(), 'platform_admin'::public.app_role)
    OR (public.has_role(auth.uid(), 'company_admin'::public.app_role)
        AND company_id = public.get_user_company_id(auth.uid()))
  );

CREATE POLICY "Company admins insert own compliance docs"
  ON public.company_compliance_documents FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'platform_admin'::public.app_role)
    OR (public.has_role(auth.uid(), 'company_admin'::public.app_role)
        AND company_id = public.get_user_company_id(auth.uid()))
  );

CREATE POLICY "Admins update compliance docs"
  ON public.company_compliance_documents FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'platform_admin'::public.app_role)
    OR (public.has_role(auth.uid(), 'company_admin'::public.app_role)
        AND company_id = public.get_user_company_id(auth.uid()))
  );

CREATE POLICY "Admins delete compliance docs"
  ON public.company_compliance_documents FOR DELETE
  USING (
    public.has_role(auth.uid(), 'platform_admin'::public.app_role)
    OR (public.has_role(auth.uid(), 'company_admin'::public.app_role)
        AND company_id = public.get_user_company_id(auth.uid()))
  );

CREATE TRIGGER trg_compliance_docs_updated_at
  BEFORE UPDATE ON public.company_compliance_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Storage policies on storage.objects for the compliance-docs bucket.
-- Path layout: {company_id}/{filename}
CREATE POLICY "Compliance docs read - admins"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'compliance-docs'
    AND (
      public.has_role(auth.uid(), 'platform_admin'::public.app_role)
      OR (public.has_role(auth.uid(), 'company_admin'::public.app_role)
          AND (storage.foldername(name))[1] = public.get_user_company_id(auth.uid())::text)
    )
  );

CREATE POLICY "Compliance docs upload - company admin"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'compliance-docs'
    AND (
      public.has_role(auth.uid(), 'platform_admin'::public.app_role)
      OR (public.has_role(auth.uid(), 'company_admin'::public.app_role)
          AND (storage.foldername(name))[1] = public.get_user_company_id(auth.uid())::text)
    )
  );

CREATE POLICY "Compliance docs update - admins"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'compliance-docs'
    AND (
      public.has_role(auth.uid(), 'platform_admin'::public.app_role)
      OR (public.has_role(auth.uid(), 'company_admin'::public.app_role)
          AND (storage.foldername(name))[1] = public.get_user_company_id(auth.uid())::text)
    )
  );

CREATE POLICY "Compliance docs delete - admins"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'compliance-docs'
    AND (
      public.has_role(auth.uid(), 'platform_admin'::public.app_role)
      OR (public.has_role(auth.uid(), 'company_admin'::public.app_role)
          AND (storage.foldername(name))[1] = public.get_user_company_id(auth.uid())::text)
    )
  );
