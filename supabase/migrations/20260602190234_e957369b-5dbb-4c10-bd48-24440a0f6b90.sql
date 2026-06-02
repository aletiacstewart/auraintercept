
-- Add last_sent_at to marketing_campaigns
ALTER TABLE public.marketing_campaigns
  ADD COLUMN IF NOT EXISTS last_sent_at TIMESTAMPTZ;

-- Per-recipient send log
CREATE TABLE IF NOT EXISTS public.campaign_sends (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.marketing_campaigns(id) ON DELETE CASCADE,
  company_id UUID NOT NULL,
  customer_id UUID,
  customer_name TEXT,
  recipient TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email','sms')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed','skipped')),
  error TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaign_sends_campaign ON public.campaign_sends(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_sends_company  ON public.campaign_sends(company_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_sends TO authenticated;
GRANT ALL ON public.campaign_sends TO service_role;

ALTER TABLE public.campaign_sends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view their campaign sends"
  ON public.campaign_sends
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'platform_admin')
  );

CREATE POLICY "Service role manages campaign sends"
  ON public.campaign_sends
  FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);
