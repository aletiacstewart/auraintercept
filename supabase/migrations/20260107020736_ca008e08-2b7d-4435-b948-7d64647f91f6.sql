-- Add customer_user_id to appointments table
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS customer_user_id uuid REFERENCES auth.users(id);

-- Add customer_user_id to quotes table
ALTER TABLE public.quotes 
ADD COLUMN IF NOT EXISTS customer_user_id uuid REFERENCES auth.users(id);

-- Add customer_user_id to invoices table
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS customer_user_id uuid REFERENCES auth.users(id);

-- Create index for faster customer lookups
CREATE INDEX IF NOT EXISTS idx_appointments_customer_user_id ON public.appointments(customer_user_id);
CREATE INDEX IF NOT EXISTS idx_quotes_customer_user_id ON public.quotes(customer_user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_user_id ON public.invoices(customer_user_id);

-- Add RLS policy for customers to view their own appointments
CREATE POLICY "Customers can view their own appointments" 
ON public.appointments 
FOR SELECT 
USING (
  auth.uid() = customer_user_id 
  OR public.has_role(auth.uid(), 'company_admin') 
  OR public.has_role(auth.uid(), 'platform_admin')
  OR (
    public.has_role(auth.uid(), 'employee') 
    AND company_id = public.get_user_company_id(auth.uid())
  )
);

-- Add RLS policy for customers to view their own quotes
CREATE POLICY "Customers can view their own quotes" 
ON public.quotes 
FOR SELECT 
USING (
  auth.uid() = customer_user_id 
  OR public.has_role(auth.uid(), 'company_admin') 
  OR public.has_role(auth.uid(), 'platform_admin')
  OR (
    public.has_role(auth.uid(), 'employee') 
    AND company_id = public.get_user_company_id(auth.uid())
  )
);

-- Add RLS policy for customers to view their own invoices
CREATE POLICY "Customers can view their own invoices" 
ON public.invoices 
FOR SELECT 
USING (
  auth.uid() = customer_user_id 
  OR public.has_role(auth.uid(), 'company_admin') 
  OR public.has_role(auth.uid(), 'platform_admin')
  OR (
    public.has_role(auth.uid(), 'employee') 
    AND company_id = public.get_user_company_id(auth.uid())
  )
);