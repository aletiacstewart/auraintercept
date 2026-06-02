ALTER TABLE public.sms_logs ADD COLUMN IF NOT EXISTS source TEXT;
CREATE INDEX IF NOT EXISTS idx_sms_logs_company_created ON public.sms_logs(company_id, created_at DESC);
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS missed_call_reply_known_only BOOLEAN NOT NULL DEFAULT TRUE;