-- Create customer_company_associations table for customers to interact with multiple companies
CREATE TABLE public.customer_company_associations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  customer_profile_id UUID REFERENCES public.customer_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_interaction_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_favorite BOOLEAN DEFAULT false,
  UNIQUE(customer_user_id, company_id)
);

-- Enable RLS
ALTER TABLE public.customer_company_associations ENABLE ROW LEVEL SECURITY;

-- Customers can view and manage their own company associations
CREATE POLICY "Customers can view their own company associations"
  ON public.customer_company_associations
  FOR SELECT
  USING (customer_user_id = auth.uid());

CREATE POLICY "Customers can create company associations"
  ON public.customer_company_associations
  FOR INSERT
  WITH CHECK (customer_user_id = auth.uid());

CREATE POLICY "Customers can update their own associations"
  ON public.customer_company_associations
  FOR UPDATE
  USING (customer_user_id = auth.uid());

CREATE POLICY "Customers can delete their own associations"
  ON public.customer_company_associations
  FOR DELETE
  USING (customer_user_id = auth.uid());

-- Company admins can view associations with their company
CREATE POLICY "Company admins can view customer associations"
  ON public.customer_company_associations
  FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()) AND has_role(auth.uid(), 'company_admin'));

-- Platform admins can view all
CREATE POLICY "Platform admins can view all customer associations"
  ON public.customer_company_associations
  FOR SELECT
  USING (has_role(auth.uid(), 'platform_admin'));

-- Allow public read access to company basic info for browsing
CREATE POLICY "Anyone can view company public info"
  ON public.companies
  FOR SELECT
  USING (true);

-- Add indexes for performance
CREATE INDEX idx_customer_company_associations_customer ON public.customer_company_associations(customer_user_id);
CREATE INDEX idx_customer_company_associations_company ON public.customer_company_associations(company_id);

-- Create a function to check if user is a customer
CREATE OR REPLACE FUNCTION public.is_customer(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'customer'
  )
$$;

-- Create a customer's company access check function
CREATE OR REPLACE FUNCTION public.customer_has_company_access(_user_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.customer_company_associations
    WHERE customer_user_id = _user_id
      AND company_id = _company_id
  )
$$;