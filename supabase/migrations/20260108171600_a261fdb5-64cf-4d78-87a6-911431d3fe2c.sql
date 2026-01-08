-- Add payment link columns to invoices table for Stripe integration
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS payment_link_url TEXT,
ADD COLUMN IF NOT EXISTS payment_link_id TEXT;

-- Add column to track if payment link was included when sending
ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS include_payment_link BOOLEAN DEFAULT false;

-- Create index for faster payment link lookups
CREATE INDEX IF NOT EXISTS idx_invoices_payment_link_id ON public.invoices(payment_link_id) WHERE payment_link_id IS NOT NULL;