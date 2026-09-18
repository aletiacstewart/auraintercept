ALTER TABLE public.tenant_integrations
  ADD COLUMN IF NOT EXISTS upload_post_api_key text,
  ADD COLUMN IF NOT EXISTS upload_post_profile text,
  ADD COLUMN IF NOT EXISTS upload_post_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS upload_post_auto_publish boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS upload_post_accounts jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS upload_post_synced_at timestamptz;