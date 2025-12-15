-- Add elevenlabs_agent_id column to tenant_integrations
ALTER TABLE public.tenant_integrations
ADD COLUMN IF NOT EXISTS elevenlabs_agent_id text;