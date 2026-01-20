-- Add Stripe API key columns to tenant_integrations for per-company payment processing
ALTER TABLE public.tenant_integrations 
ADD COLUMN IF NOT EXISTS stripe_publishable_key text,
ADD COLUMN IF NOT EXISTS stripe_secret_key text,
ADD COLUMN IF NOT EXISTS stripe_webhook_secret text;