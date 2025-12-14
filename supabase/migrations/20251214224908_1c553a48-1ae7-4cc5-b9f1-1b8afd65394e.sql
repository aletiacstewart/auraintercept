-- Add Resend API key column to tenant_integrations for per-company email configuration
ALTER TABLE public.tenant_integrations 
ADD COLUMN resend_api_key text;