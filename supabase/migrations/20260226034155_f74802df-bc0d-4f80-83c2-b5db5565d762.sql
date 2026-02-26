DROP VIEW IF EXISTS public.tenant_integrations_safe;

CREATE VIEW public.tenant_integrations_safe AS
SELECT
  id,
  company_id,
  created_at,
  updated_at,
  -- Boolean flags for sensitive credentials (no raw keys exposed)
  (elevenlabs_api_key IS NOT NULL AND elevenlabs_api_key != '') AS has_elevenlabs,
  (twilio_account_sid IS NOT NULL AND twilio_account_sid != '') AS has_twilio,
  (signalwire_project_id IS NOT NULL AND signalwire_project_id != '' AND signalwire_api_token IS NOT NULL AND signalwire_api_token != '' AND signalwire_phone_number IS NOT NULL AND signalwire_phone_number != '') AS has_signalwire,
  (google_refresh_token IS NOT NULL AND google_refresh_token != '') AS has_google,
  (stripe_secret_key IS NOT NULL AND stripe_secret_key != '') AS has_stripe,
  (openai_api_key IS NOT NULL AND openai_api_key != '') AS has_openai,
  (resend_api_key IS NOT NULL AND resend_api_key != '') AS has_resend,
  (tavily_api_key IS NOT NULL AND tavily_api_key != '') AS has_tavily,
  -- Non-sensitive config/public fields safe to expose
  stripe_publishable_key,
  twilio_phone_number,
  signalwire_phone_number,
  signalwire_project_id,
  signalwire_space_url,
  elevenlabs_agent_id,
  elevenlabs_voice_id,
  elevenlabs_voice_stability,
  elevenlabs_voice_similarity,
  elevenlabs_voice_style,
  elevenlabs_voice_speed,
  tts_provider,
  tts_monthly_limit,
  use_platform_tts,
  google_calendar_id,
  google_calendar_enabled,
  google_tts_model,
  google_tts_voice,
  openai_tts_model,
  openai_tts_voice
FROM public.tenant_integrations;