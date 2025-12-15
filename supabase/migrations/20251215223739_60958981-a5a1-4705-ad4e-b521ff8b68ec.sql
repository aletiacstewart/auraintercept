-- Add voice settings columns to tenant_integrations
ALTER TABLE public.tenant_integrations 
ADD COLUMN IF NOT EXISTS elevenlabs_voice_stability NUMERIC DEFAULT 0.5,
ADD COLUMN IF NOT EXISTS elevenlabs_voice_similarity NUMERIC DEFAULT 0.75,
ADD COLUMN IF NOT EXISTS elevenlabs_voice_style NUMERIC DEFAULT 0.5,
ADD COLUMN IF NOT EXISTS elevenlabs_voice_speed NUMERIC DEFAULT 1.0;