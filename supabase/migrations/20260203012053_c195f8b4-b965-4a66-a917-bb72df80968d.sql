-- 1. Create a secure view for tenant_integrations that masks sensitive credentials
-- This view shows only metadata about configured integrations, not the actual secrets
CREATE OR REPLACE VIEW public.tenant_integrations_safe AS
SELECT 
  id,
  company_id,
  created_at,
  updated_at,
  -- Boolean flags indicating if credentials are configured (not the actual values)
  CASE WHEN twilio_account_sid IS NOT NULL AND twilio_account_sid != '' THEN true ELSE false END as has_twilio,
  CASE WHEN elevenlabs_api_key IS NOT NULL AND elevenlabs_api_key != '' THEN true ELSE false END as has_elevenlabs,
  CASE WHEN google_refresh_token IS NOT NULL AND google_refresh_token != '' THEN true ELSE false END as has_google,
  CASE WHEN stripe_secret_key IS NOT NULL AND stripe_secret_key != '' THEN true ELSE false END as has_stripe,
  CASE WHEN openai_api_key IS NOT NULL AND openai_api_key != '' THEN true ELSE false END as has_openai,
  CASE WHEN resend_api_key IS NOT NULL AND resend_api_key != '' THEN true ELSE false END as has_resend,
  CASE WHEN tavily_api_key IS NOT NULL AND tavily_api_key != '' THEN true ELSE false END as has_tavily,
  -- Safe metadata fields (not credentials)
  twilio_phone_number,
  elevenlabs_voice_id,
  elevenlabs_agent_id,
  google_calendar_id,
  stripe_publishable_key  -- Publishable keys are safe to expose
FROM public.tenant_integrations;

-- 2. Enable RLS on the view
ALTER VIEW public.tenant_integrations_safe SET (security_invoker = true);

-- 3. Create RPC function to validate if specific integration is configured (returns boolean only)
CREATE OR REPLACE FUNCTION public.check_integration_configured(
  p_company_id UUID,
  p_integration_type TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result BOOLEAN := false;
BEGIN
  -- Verify caller has access to this company
  IF NOT EXISTS (
    SELECT 1 FROM public.tenant_integrations ti
    WHERE ti.company_id = p_company_id
    AND (
      public.has_role(auth.uid(), 'platform_admin') OR
      public.get_user_company_id(auth.uid()) = p_company_id
    )
  ) THEN
    RETURN false;
  END IF;

  -- Check specific integration type
  CASE p_integration_type
    WHEN 'twilio' THEN
      SELECT (twilio_account_sid IS NOT NULL AND twilio_account_sid != '' AND 
              twilio_auth_token IS NOT NULL AND twilio_auth_token != '')
      INTO v_result
      FROM public.tenant_integrations
      WHERE company_id = p_company_id;
    WHEN 'elevenlabs' THEN
      SELECT (elevenlabs_api_key IS NOT NULL AND elevenlabs_api_key != '')
      INTO v_result
      FROM public.tenant_integrations
      WHERE company_id = p_company_id;
    WHEN 'google' THEN
      SELECT (google_refresh_token IS NOT NULL AND google_refresh_token != '')
      INTO v_result
      FROM public.tenant_integrations
      WHERE company_id = p_company_id;
    WHEN 'stripe' THEN
      SELECT (stripe_secret_key IS NOT NULL AND stripe_secret_key != '')
      INTO v_result
      FROM public.tenant_integrations
      WHERE company_id = p_company_id;
    WHEN 'openai' THEN
      SELECT (openai_api_key IS NOT NULL AND openai_api_key != '')
      INTO v_result
      FROM public.tenant_integrations
      WHERE company_id = p_company_id;
    WHEN 'resend' THEN
      SELECT (resend_api_key IS NOT NULL AND resend_api_key != '')
      INTO v_result
      FROM public.tenant_integrations
      WHERE company_id = p_company_id;
    ELSE
      v_result := false;
  END CASE;

  RETURN COALESCE(v_result, false);
END;
$$;

-- 4. Add token expiration column to appointments table
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS customer_token_expires_at TIMESTAMP WITH TIME ZONE 
DEFAULT (now() + interval '30 days');

-- 5. Update existing appointments with token expiration (30 days from now for existing tokens)
UPDATE public.appointments 
SET customer_token_expires_at = now() + interval '30 days'
WHERE customer_token IS NOT NULL AND customer_token_expires_at IS NULL;

-- 6. Create or replace the RLS policy to include token expiration check
DROP POLICY IF EXISTS "Anyone can view appointment by token" ON public.appointments;
CREATE POLICY "Anyone can view appointment by token" 
ON public.appointments 
FOR SELECT 
USING (
  customer_token IS NOT NULL AND 
  customer_token_expires_at > now()
);

-- 7. Create function to regenerate customer token (invalidates old, creates new)
CREATE OR REPLACE FUNCTION public.regenerate_customer_token(p_appointment_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_token UUID;
  v_company_id UUID;
BEGIN
  -- Get the company_id for the appointment
  SELECT company_id INTO v_company_id
  FROM public.appointments
  WHERE id = p_appointment_id;

  -- Verify caller has access to this appointment's company
  IF v_company_id IS NULL OR (
    NOT public.has_role(auth.uid(), 'platform_admin') AND
    public.get_user_company_id(auth.uid()) != v_company_id
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Generate new token
  v_new_token := gen_random_uuid();

  -- Update the appointment with new token and reset expiration
  UPDATE public.appointments
  SET 
    customer_token = v_new_token,
    customer_token_expires_at = now() + interval '30 days',
    updated_at = now()
  WHERE id = p_appointment_id;

  RETURN v_new_token;
END;
$$;