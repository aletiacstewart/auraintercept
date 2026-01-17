-- Add about section columns to smart_websites table (may already exist partially)
ALTER TABLE public.smart_websites ADD COLUMN IF NOT EXISTS show_about_section boolean NOT NULL DEFAULT false;
ALTER TABLE public.smart_websites ADD COLUMN IF NOT EXISTS about_image_url text;
ALTER TABLE public.smart_websites ADD COLUMN IF NOT EXISTS about_header text;
ALTER TABLE public.smart_websites ADD COLUMN IF NOT EXISTS about_subheader text;
ALTER TABLE public.smart_websites ADD COLUMN IF NOT EXISTS about_paragraph text;