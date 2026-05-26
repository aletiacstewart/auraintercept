
-- Invites table
CREATE TABLE public.onboarding_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  company_name TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent','in_progress','submitted','expired')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  submitted_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_onboarding_invites_token ON public.onboarding_invites(token);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.onboarding_invites TO authenticated;
GRANT ALL ON public.onboarding_invites TO service_role;
ALTER TABLE public.onboarding_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Platform admins manage invites"
  ON public.onboarding_invites FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'platform_admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'platform_admin'::public.app_role));

-- Submissions table
CREATE TABLE public.onboarding_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invite_id UUID NOT NULL REFERENCES public.onboarding_invites(id) ON DELETE CASCADE UNIQUE,
  form_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  signature JSONB,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.onboarding_submissions TO authenticated;
GRANT ALL ON public.onboarding_submissions TO service_role;
ALTER TABLE public.onboarding_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Platform admins read submissions"
  ON public.onboarding_submissions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'platform_admin'::public.app_role));

-- Uploads metadata table
CREATE TABLE public.onboarding_uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invite_id UUID NOT NULL REFERENCES public.onboarding_invites(id) ON DELETE CASCADE,
  section TEXT NOT NULL,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_onboarding_uploads_invite ON public.onboarding_uploads(invite_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.onboarding_uploads TO authenticated;
GRANT ALL ON public.onboarding_uploads TO service_role;
ALTER TABLE public.onboarding_uploads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Platform admins read uploads"
  ON public.onboarding_uploads FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'platform_admin'::public.app_role));

-- Updated_at triggers
CREATE TRIGGER trg_onboarding_invites_updated
  BEFORE UPDATE ON public.onboarding_invites
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_onboarding_submissions_updated
  BEFORE UPDATE ON public.onboarding_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Private storage bucket for uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('onboarding-uploads', 'onboarding-uploads', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Platform admins read onboarding files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'onboarding-uploads' AND public.has_role(auth.uid(), 'platform_admin'::public.app_role));
