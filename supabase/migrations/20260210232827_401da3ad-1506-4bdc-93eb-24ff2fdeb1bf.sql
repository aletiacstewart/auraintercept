-- Create a security-definer function that returns integration feature flags
-- without exposing sensitive API keys
CREATE OR REPLACE FUNCTION public.get_company_feature_flags(p_company_id uuid)
RETURNS TABLE(
  has_voice_chat boolean,
  has_sms boolean,
  has_phone boolean,
  twilio_phone_number text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    -- Voice chat: has ElevenLabs API key OR uses platform TTS
    COALESCE(
      (ti.elevenlabs_api_key IS NOT NULL AND ti.elevenlabs_api_key != '') 
      OR COALESCE(ti.use_platform_tts, false),
      false
    ) as has_voice_chat,
    -- SMS: has Twilio fully configured
    COALESCE(
      ti.twilio_phone_number IS NOT NULL AND ti.twilio_phone_number != '' AND
      ti.twilio_account_sid IS NOT NULL AND ti.twilio_account_sid != '' AND
      ti.twilio_auth_token IS NOT NULL AND ti.twilio_auth_token != '',
      false
    ) as has_sms,
    -- Phone: has dispatch phone on company
    COALESCE(
      c.dispatch_phone IS NOT NULL AND c.dispatch_phone != '',
      false
    ) as has_phone,
    -- Return twilio phone for call button (non-sensitive)
    ti.twilio_phone_number
  FROM public.companies c
  LEFT JOIN public.tenant_integrations ti ON ti.company_id = c.id
  WHERE c.id = p_company_id;
END;
$function$;