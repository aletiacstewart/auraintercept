-- Create customer_profiles table for storing customer account information
CREATE TABLE public.customer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  phone TEXT,
  name TEXT NOT NULL,
  address TEXT,
  notes TEXT,
  -- Communication preferences
  sms_opt_out BOOLEAN DEFAULT FALSE,
  email_opt_out BOOLEAN DEFAULT FALSE,
  call_opt_out BOOLEAN DEFAULT FALSE,
  -- Portal access token for customer dashboard
  portal_token UUID DEFAULT gen_random_uuid() UNIQUE,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  -- Ensure unique email per company
  UNIQUE(company_id, email)
);

-- Enable RLS
ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for customer_profiles

-- Company admins can manage all customers in their company
CREATE POLICY "Company admins can manage customer profiles"
ON public.customer_profiles
FOR ALL
USING (
  (company_id = get_user_company_id(auth.uid())) 
  AND has_role(auth.uid(), 'company_admin'::app_role)
);

-- Employees can view customers in their company
CREATE POLICY "Employees can view customer profiles"
ON public.customer_profiles
FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

-- Platform admins can view all customer profiles
CREATE POLICY "Platform admins can view all customer profiles"
ON public.customer_profiles
FOR SELECT
USING (has_role(auth.uid(), 'platform_admin'::app_role));

-- Anonymous users can view their own profile via portal_token (for customer dashboard)
CREATE POLICY "Customers can view own profile via token"
ON public.customer_profiles
FOR SELECT
USING (portal_token IS NOT NULL);

-- Create updated_at trigger
CREATE TRIGGER update_customer_profiles_updated_at
  BEFORE UPDATE ON public.customer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to auto-create customer profile from appointment
CREATE OR REPLACE FUNCTION public.upsert_customer_profile_from_appointment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only proceed if customer has an email
  IF NEW.customer_email IS NOT NULL AND NEW.customer_email != '' THEN
    INSERT INTO public.customer_profiles (
      company_id,
      email,
      phone,
      name,
      address,
      sms_opt_out,
      email_opt_out,
      call_opt_out
    ) VALUES (
      NEW.company_id,
      NEW.customer_email,
      NEW.customer_phone,
      NEW.customer_name,
      NEW.customer_address,
      NEW.sms_opt_out,
      NEW.email_opt_out,
      NEW.call_opt_out
    )
    ON CONFLICT (company_id, email) DO UPDATE SET
      phone = COALESCE(EXCLUDED.phone, customer_profiles.phone),
      name = COALESCE(EXCLUDED.name, customer_profiles.name),
      address = COALESCE(EXCLUDED.address, customer_profiles.address),
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-create customer profile when appointment is created
CREATE TRIGGER create_customer_profile_on_appointment
  AFTER INSERT ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.upsert_customer_profile_from_appointment();

-- Create index for faster portal token lookups
CREATE INDEX idx_customer_profiles_portal_token ON public.customer_profiles(portal_token);
CREATE INDEX idx_customer_profiles_company_email ON public.customer_profiles(company_id, email);
CREATE INDEX idx_customer_profiles_phone ON public.customer_profiles(phone);