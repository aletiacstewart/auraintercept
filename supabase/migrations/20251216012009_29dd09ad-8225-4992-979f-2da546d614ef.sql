-- Add TTS provider configuration to tenant_integrations
ALTER TABLE public.tenant_integrations
ADD COLUMN IF NOT EXISTS tts_provider text DEFAULT 'elevenlabs' CHECK (tts_provider IN ('elevenlabs', 'openai', 'google')),
ADD COLUMN IF NOT EXISTS openai_api_key text,
ADD COLUMN IF NOT EXISTS openai_tts_voice text DEFAULT 'alloy',
ADD COLUMN IF NOT EXISTS openai_tts_model text DEFAULT 'tts-1',
ADD COLUMN IF NOT EXISTS google_tts_api_key text,
ADD COLUMN IF NOT EXISTS google_tts_voice text DEFAULT 'en-US-Neural2-D',
ADD COLUMN IF NOT EXISTS google_tts_model text DEFAULT 'neural2';

-- Add comment for documentation
COMMENT ON COLUMN public.tenant_integrations.tts_provider IS 'TTS provider: elevenlabs, openai, or google';
COMMENT ON COLUMN public.tenant_integrations.openai_tts_voice IS 'OpenAI TTS voice: alloy, echo, fable, onyx, nova, shimmer';
COMMENT ON COLUMN public.tenant_integrations.openai_tts_model IS 'OpenAI TTS model: tts-1 (faster) or tts-1-hd (higher quality)';
COMMENT ON COLUMN public.tenant_integrations.google_tts_model IS 'Google TTS model: standard, wavenet, or neural2';