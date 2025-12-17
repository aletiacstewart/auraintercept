-- Create holiday_closures table for specific date closures
CREATE TABLE public.holiday_closures (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  closure_date date NOT NULL,
  name text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(company_id, closure_date)
);

-- Enable RLS
ALTER TABLE public.holiday_closures ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Company admins can manage holiday closures"
ON public.holiday_closures
FOR ALL
USING ((company_id = get_user_company_id(auth.uid())) AND has_role(auth.uid(), 'company_admin'::app_role));

CREATE POLICY "Employees can view holiday closures"
ON public.holiday_closures
FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Platform admins can manage all holiday closures"
ON public.holiday_closures
FOR ALL
USING (has_role(auth.uid(), 'platform_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'platform_admin'::app_role));