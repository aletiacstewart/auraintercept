
ALTER TABLE public.campaign_sends
  ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS clicked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS provider_message_id TEXT;

CREATE INDEX IF NOT EXISTS idx_campaign_sends_campaign_id ON public.campaign_sends(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_sends_provider_message_id ON public.campaign_sends(provider_message_id);
