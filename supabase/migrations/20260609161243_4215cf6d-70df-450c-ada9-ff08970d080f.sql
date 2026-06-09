
GRANT SELECT (stripe_customer_id, aura_sms_consent_ip, calendar_feed_token)
  ON public.companies TO authenticated;
GRANT UPDATE (stripe_customer_id, aura_sms_consent_ip, calendar_feed_token)
  ON public.companies TO authenticated;
