-- Create warranty_policies table for companies to define their warranty offerings
CREATE TABLE public.warranty_policies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  coverage_type TEXT NOT NULL DEFAULT 'standard',
  duration_months INTEGER NOT NULL DEFAULT 12,
  coverage_details TEXT,
  terms_conditions TEXT,
  exclusions TEXT,
  labor_covered BOOLEAN DEFAULT true,
  parts_covered BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.warranty_policies ENABLE ROW LEVEL SECURITY;

-- Anyone can view active warranty policies (for customer portal)
CREATE POLICY "Anyone can view active warranty policies"
  ON public.warranty_policies
  FOR SELECT
  USING (is_active = true);

-- Company admins can manage their warranty policies
CREATE POLICY "Company admins can manage warranty policies"
  ON public.warranty_policies
  FOR ALL
  USING (company_id = get_user_company_id(auth.uid()) AND has_role(auth.uid(), 'company_admin'::app_role));

-- Employees can view warranty policies
CREATE POLICY "Employees can view warranty policies"
  ON public.warranty_policies
  FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

-- Platform admins can view all warranty policies
CREATE POLICY "Platform admins can view all warranty policies"
  ON public.warranty_policies
  FOR SELECT
  USING (has_role(auth.uid(), 'platform_admin'::app_role));

-- Add updated_at trigger
CREATE TRIGGER update_warranty_policies_updated_at
  BEFORE UPDATE ON public.warranty_policies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();