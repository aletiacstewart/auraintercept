-- Create enum for employee job types (corresponding to AI agent categories)
CREATE TYPE public.employee_job_type AS ENUM (
  'technician',
  'booking_agent', 
  'dispatch',
  'customer_service',
  'billing',
  'marketing',
  'inventory',
  'analytics'
);

-- Create table to assign job types to employees (many-to-many)
CREATE TABLE public.employee_job_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_type employee_job_type NOT NULL,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  assigned_by UUID REFERENCES public.profiles(id),
  UNIQUE (employee_id, job_type)
);

-- Enable RLS
ALTER TABLE public.employee_job_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Company admins can manage employee job assignments"
ON public.employee_job_assignments
FOR ALL
USING (
  company_id = get_user_company_id(auth.uid()) 
  AND has_role(auth.uid(), 'company_admin'::app_role)
);

CREATE POLICY "Employees can view their own job assignments"
ON public.employee_job_assignments
FOR SELECT
USING (employee_id = auth.uid());

CREATE POLICY "Platform admins can manage all job assignments"
ON public.employee_job_assignments
FOR ALL
USING (has_role(auth.uid(), 'platform_admin'::app_role));

-- Create index for faster lookups
CREATE INDEX idx_employee_job_assignments_employee ON public.employee_job_assignments(employee_id);
CREATE INDEX idx_employee_job_assignments_company ON public.employee_job_assignments(company_id);