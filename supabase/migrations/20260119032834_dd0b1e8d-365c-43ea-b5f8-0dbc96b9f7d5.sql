-- Add the missing columns first
ALTER TABLE public.smart_websites 
ADD COLUMN IF NOT EXISTS gallery_images TEXT[] DEFAULT '{}';

ALTER TABLE public.smart_websites 
ADD COLUMN IF NOT EXISTS logo_transparency_mode TEXT DEFAULT 'none';