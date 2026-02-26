
-- Fix get_company_feature_flags to use SECURITY DEFINER so it can read tenant_integrations
-- regardless of the caller's role (needed for customer portal, employee views, etc.)
CREATE OR REPLACE FUNCTION public.get_company_feature_flags(p_company_id uuid)
RETURNS TABLE(
  has_voice_chat boolean,
  has_sms boolean,
  has_phone boolean,
  twilio_phone_number text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(
      (ti.elevenlabs_api_key IS NOT NULL AND ti.elevenlabs_api_key != '') 
      OR COALESCE(ti.use_platform_tts, false)
      OR (c.subscription_tier IS NOT NULL),
      false
    ) as has_voice_chat,
    COALESCE(
      ti.signalwire_phone_number IS NOT NULL AND ti.signalwire_phone_number != '' AND
      ti.signalwire_project_id IS NOT NULL AND ti.signalwire_project_id != '' AND
      ti.signalwire_api_token IS NOT NULL AND ti.signalwire_api_token != '',
      false
    ) as has_sms,
    COALESCE(
      (ti.signalwire_phone_number IS NOT NULL AND ti.signalwire_phone_number != '') OR
      (c.dispatch_phone IS NOT NULL AND c.dispatch_phone != ''),
      false
    ) as has_phone,
    COALESCE(ti.signalwire_phone_number, c.dispatch_phone) as twilio_phone_number
  FROM public.companies c
  LEFT JOIN public.tenant_integrations ti ON ti.company_id = c.id
  WHERE c.id = p_company_id;
END;
$$;
