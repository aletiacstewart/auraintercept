-- Add visibility toggles for emergency hours, field hours, and holidays on Smart Website
ALTER TABLE public.smart_websites
ADD COLUMN IF NOT EXISTS show_emergency_hours boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS show_field_hours boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS show_holidays boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.smart_websites.show_emergency_hours IS 'Whether to display emergency hours on the Smart Website';
COMMENT ON COLUMN public.smart_websites.show_field_hours IS 'Whether to display field hours on the Smart Website';
COMMENT ON COLUMN public.smart_websites.show_holidays IS 'Whether to display holidays on the Smart Website';