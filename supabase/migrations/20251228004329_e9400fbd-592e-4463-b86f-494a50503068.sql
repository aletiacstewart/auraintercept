-- Add price_display column to services table for custom pricing format (e.g., "$100-$250")
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS price_display text;

-- Add comment for documentation
COMMENT ON COLUMN public.services.price_display IS 'Custom pricing display text (e.g., "$100-$250", "Starting at $50")';