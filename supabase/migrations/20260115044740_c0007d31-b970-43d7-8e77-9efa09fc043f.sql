-- Create a cross-company access attempt log table for security auditing
CREATE TABLE IF NOT EXISTS public.cross_company_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  attempted_company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  authorized_company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  access_type TEXT NOT NULL DEFAULT 'chat',
  ip_address TEXT,
  user_agent TEXT,
  was_authorized BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes for efficient queries
CREATE INDEX idx_cross_company_logs_customer ON public.cross_company_access_logs(customer_user_id);
CREATE INDEX idx_cross_company_logs_company ON public.cross_company_access_logs(attempted_company_id);
CREATE INDEX idx_cross_company_logs_created ON public.cross_company_access_logs(created_at);
CREATE INDEX idx_cross_company_logs_unauthorized ON public.cross_company_access_logs(was_authorized) WHERE was_authorized = false;

-- Enable RLS
ALTER TABLE public.cross_company_access_logs ENABLE ROW LEVEL SECURITY;

-- Platform admins can view all logs
CREATE POLICY "Platform admins can view all access logs"
  ON public.cross_company_access_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'platform_admin'::public.app_role));

-- Company admins can view logs for their company
CREATE POLICY "Company admins can view their company access logs"
  ON public.cross_company_access_logs FOR SELECT
  USING (
    attempted_company_id = public.get_user_company_id(auth.uid())
    AND public.has_role(auth.uid(), 'company_admin'::public.app_role)
  );

-- Allow edge functions to insert logs (service role)
-- Note: Service role bypasses RLS, so no INSERT policy needed