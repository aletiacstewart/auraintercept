-- Add include_portal_link column to sms_templates table
ALTER TABLE public.sms_templates 
ADD COLUMN IF NOT EXISTS include_portal_link BOOLEAN NOT NULL DEFAULT true;