-- Add Smart Website specific contact fields
-- Primary contact with name/title
ALTER TABLE public.smart_websites
ADD COLUMN IF NOT EXISTS contact_name text,
ADD COLUMN IF NOT EXISTS contact_title text,
ADD COLUMN IF NOT EXISTS contact_phone text,
ADD COLUMN IF NOT EXISTS contact_email text,
ADD COLUMN IF NOT EXISTS contact_address text,
-- Additional contact person 1
ADD COLUMN IF NOT EXISTS contact2_name text,
ADD COLUMN IF NOT EXISTS contact2_title text,
ADD COLUMN IF NOT EXISTS contact2_phone text,
ADD COLUMN IF NOT EXISTS contact2_email text,
-- Additional contact person 2
ADD COLUMN IF NOT EXISTS contact3_name text,
ADD COLUMN IF NOT EXISTS contact3_title text,
ADD COLUMN IF NOT EXISTS contact3_phone text,
ADD COLUMN IF NOT EXISTS contact3_email text;

COMMENT ON COLUMN public.smart_websites.contact_name IS 'Primary contact name for Smart Website';
COMMENT ON COLUMN public.smart_websites.contact_title IS 'Primary contact title/position for Smart Website';
COMMENT ON COLUMN public.smart_websites.contact2_name IS 'Secondary contact name for Smart Website';
COMMENT ON COLUMN public.smart_websites.contact3_name IS 'Third contact name for Smart Website';