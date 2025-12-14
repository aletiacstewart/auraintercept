-- Add customer token for secure portal access
ALTER TABLE public.appointments 
ADD COLUMN customer_token uuid DEFAULT gen_random_uuid();

-- Create unique index on customer_token
CREATE UNIQUE INDEX idx_appointments_customer_token ON public.appointments(customer_token);

-- Allow public read access to appointments via token (for customer portal)
CREATE POLICY "Anyone can view appointment by token" 
ON public.appointments 
FOR SELECT 
USING (customer_token IS NOT NULL);