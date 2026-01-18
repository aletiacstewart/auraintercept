-- Add Smart Website display preference columns to services table
ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS website_show_service boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS website_show_price boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS website_show_duration boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS website_show_description boolean NOT NULL DEFAULT true;

-- Add comment for clarity
COMMENT ON COLUMN public.services.website_show_service IS 'Whether to display this service on the Smart Website';
COMMENT ON COLUMN public.services.website_show_price IS 'Whether to display price on the Smart Website';
COMMENT ON COLUMN public.services.website_show_duration IS 'Whether to display duration on the Smart Website';
COMMENT ON COLUMN public.services.website_show_description IS 'Whether to display description on the Smart Website';