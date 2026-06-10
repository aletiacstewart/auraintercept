
-- 1. crm_connections
CREATE TABLE public.crm_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('hubspot','salesforce','zoho','pipedrive','generic')),
  status text NOT NULL DEFAULT 'disconnected' CHECK (status IN ('disconnected','connected','error','pending')),
  auth_type text NOT NULL DEFAULT 'api_key' CHECK (auth_type IN ('oauth','api_key','webhook')),
  external_account_label text,
  sync_direction text NOT NULL DEFAULT 'two_way' CHECK (sync_direction IN ('push','pull','two_way')),
  credentials jsonb NOT NULL DEFAULT '{}'::jsonb,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_sync_at timestamptz,
  last_error text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, provider)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_connections TO authenticated;
GRANT ALL ON public.crm_connections TO service_role;
ALTER TABLE public.crm_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "company admins manage own crm connections"
  ON public.crm_connections FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'platform_admin'::public.app_role)
    OR (company_id = public.get_user_company_id(auth.uid())
        AND public.has_role(auth.uid(), 'company_admin'::public.app_role))
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'platform_admin'::public.app_role)
    OR (company_id = public.get_user_company_id(auth.uid())
        AND public.has_role(auth.uid(), 'company_admin'::public.app_role))
  );
CREATE POLICY "company members read own crm connections"
  ON public.crm_connections FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));

-- 2. crm_sync_log
CREATE TABLE public.crm_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid NOT NULL REFERENCES public.crm_connections(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  direction text NOT NULL CHECK (direction IN ('in','out')),
  entity text NOT NULL DEFAULT 'lead',
  external_id text,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  status text NOT NULL CHECK (status IN ('success','error','skipped')),
  error text,
  payload_summary jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.crm_sync_log TO authenticated;
GRANT ALL ON public.crm_sync_log TO service_role;
ALTER TABLE public.crm_sync_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "company members read own sync log"
  ON public.crm_sync_log FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'platform_admin'::public.app_role)
    OR company_id = public.get_user_company_id(auth.uid())
  );

-- 3. lead_import_jobs
CREATE TABLE public.lead_import_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  uploaded_by uuid REFERENCES auth.users(id),
  source_filename text NOT NULL,
  mime_type text,
  storage_path text NOT NULL,
  mode text NOT NULL DEFAULT 'review' CHECK (mode IN ('auto','review')),
  status text NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded','parsing','ready_for_review','importing','completed','failed')),
  total_rows integer NOT NULL DEFAULT 0,
  imported_count integer NOT NULL DEFAULT 0,
  duplicate_count integer NOT NULL DEFAULT 0,
  error_count integer NOT NULL DEFAULT 0,
  parser_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_import_jobs TO authenticated;
GRANT ALL ON public.lead_import_jobs TO service_role;
ALTER TABLE public.lead_import_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "company admins manage own import jobs"
  ON public.lead_import_jobs FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'platform_admin'::public.app_role)
    OR (company_id = public.get_user_company_id(auth.uid())
        AND public.has_company_full_access(auth.uid()))
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'platform_admin'::public.app_role)
    OR (company_id = public.get_user_company_id(auth.uid())
        AND public.has_company_full_access(auth.uid()))
  );
CREATE POLICY "company members read own import jobs"
  ON public.lead_import_jobs FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));

-- 4. lead_import_rows
CREATE TABLE public.lead_import_rows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.lead_import_jobs(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  row_index integer NOT NULL,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  normalized jsonb NOT NULL DEFAULT '{}'::jsonb,
  dedupe_match_lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  decision text NOT NULL DEFAULT 'pending' CHECK (decision IN ('pending','approved','rejected','imported','duplicate','error')),
  imported_lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_import_rows TO authenticated;
GRANT ALL ON public.lead_import_rows TO service_role;
ALTER TABLE public.lead_import_rows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "company members manage own import rows"
  ON public.lead_import_rows FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'platform_admin'::public.app_role)
    OR (company_id = public.get_user_company_id(auth.uid())
        AND public.has_company_full_access(auth.uid()))
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'platform_admin'::public.app_role)
    OR (company_id = public.get_user_company_id(auth.uid())
        AND public.has_company_full_access(auth.uid()))
  );

-- 5. companies + leads columns
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS lead_import_mode text NOT NULL DEFAULT 'review'
    CHECK (lead_import_mode IN ('auto','review'));

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS external_crm_id text,
  ADD COLUMN IF NOT EXISTS external_crm_provider text;
CREATE INDEX IF NOT EXISTS leads_external_crm_idx
  ON public.leads (company_id, external_crm_provider, external_crm_id);

-- 6. updated_at triggers (reuse function pattern in the project)
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER set_updated_at_crm_connections BEFORE UPDATE ON public.crm_connections FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER set_updated_at_lead_import_jobs BEFORE UPDATE ON public.lead_import_jobs FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER set_updated_at_lead_import_rows BEFORE UPDATE ON public.lead_import_rows FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE INDEX IF NOT EXISTS crm_sync_log_company_created_idx ON public.crm_sync_log (company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS lead_import_rows_job_idx ON public.lead_import_rows (job_id, row_index);
