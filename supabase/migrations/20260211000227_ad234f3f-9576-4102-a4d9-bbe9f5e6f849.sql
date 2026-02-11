
CREATE OR REPLACE FUNCTION public.get_company_feature_flags(p_company_id UUID)
RETURNS TABLE(
  has_voice_chat BOOLEAN,
  has_sms BOOLEAN,
  has_phone BOOLEAN,
  twilio_phone_number TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    -- Voice chat: has ElevenLabs integration OR tier includes voice (all tiers except 'business')
    COALESCE(
      (ti.elevenlabs_api_key IS NOT NULL AND ti.elevenlabs_api_key != '') 
      OR COALESCE(ti.use_platform_tts, false)
      OR (c.subscription_tier IS NOT NULL AND c.subscription_tier NOT IN ('business')),
      false
    ) as has_voice_chat,
    -- SMS: has SignalWire fully configured
    COALESCE(
      ti.signalwire_phone_number IS NOT NULL AND ti.signalwire_phone_number != '' AND
      ti.signalwire_project_id IS NOT NULL AND ti.signalwire_project_id != '' AND
      ti.signalwire_api_token IS NOT NULL AND ti.signalwire_api_token != '',
      false
    ) as has_sms,
    -- Phone: has SignalWire phone OR dispatch phone on company
    COALESCE(
      (ti.signalwire_phone_number IS NOT NULL AND ti.signalwire_phone_number != '') OR
      (c.dispatch_phone IS NOT NULL AND c.dispatch_phone != ''),
      false
    ) as has_phone,
    -- Return SignalWire phone for call button (non-sensitive), fallback to dispatch_phone
    COALESCE(ti.signalwire_phone_number, c.dispatch_phone) as twilio_phone_number
  FROM public.companies c
  LEFT JOIN public.tenant_integrations ti ON ti.company_id = c.id
  WHERE c.id = p_company_id;
END;
$$;
