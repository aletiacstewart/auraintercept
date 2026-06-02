CREATE TABLE IF NOT EXISTS public.sms_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,
  message TEXT,
  direction TEXT NOT NULL CHECK (direction IN ('inbound','outbound')),
  status TEXT NOT NULL DEFAULT 'sent',
  error TEXT,
  provider_message_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.sms_logs TO authenticated;
GRANT ALL ON public.sms_logs TO service_role;

ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company users view their sms logs"
ON public.sms_logs FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'platform_admin'::public.app_role)
  OR public.get_user_company_id(auth.uid()) = company_id
);

CREATE POLICY "Service role manages sms logs"
ON public.sms_logs FOR ALL
TO service_role
USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_sms_logs_company_created
  ON public.sms_logs (company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_logs_direction
  ON public.sms_logs (company_id, direction, created_at DESC);