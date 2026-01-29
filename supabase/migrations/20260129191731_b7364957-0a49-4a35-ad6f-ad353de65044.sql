-- Update subscription_tier check constraint to include new tiers
ALTER TABLE public.companies DROP CONSTRAINT companies_subscription_tier_check;

ALTER TABLE public.companies ADD CONSTRAINT companies_subscription_tier_check 
CHECK (subscription_tier = ANY (ARRAY['free'::text, 'express'::text, 'core'::text, 'halo'::text, 'single_point'::text, 'multi_track'::text, 'command'::text]));

-- Create Demo Halo Company
INSERT INTO public.companies (
  name,
  slug,
  subscription_tier,
  registration_code,
  email,
  phone,
  address,
  default_email_enabled,
  default_sms_enabled,
  default_call_enabled
) VALUES (
  'Demo Halo Company',
  'demo-halo',
  'halo',
  'HALO-' || substring(gen_random_uuid()::text, 1, 8),
  'companyhalo@demo.com',
  '+1-555-0301',
  '301 Halo Demo Street, Demo City, DC 00003',
  true,
  true,
  true
);

-- Create Demo Express Company
INSERT INTO public.companies (
  name,
  slug,
  subscription_tier,
  registration_code,
  email,
  phone,
  address,
  default_email_enabled,
  default_sms_enabled,
  default_call_enabled
) VALUES (
  'Demo Express Company',
  'demo-xprs',
  'express',
  'XPRS-' || substring(gen_random_uuid()::text, 1, 8),
  'companyxprs@demo.com',
  '+1-555-0401',
  '401 Express Demo Ave, Demo City, DC 00004',
  true,
  true,
  true
);