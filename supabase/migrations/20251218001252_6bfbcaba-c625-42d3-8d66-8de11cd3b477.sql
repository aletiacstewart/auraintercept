-- Create employee availability table for different hour types (field, emergency, etc.)
CREATE TABLE public.employee_availability (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  open_time time without time zone,
  close_time time without time zone,
  is_closed boolean NOT NULL DEFAULT false,
  hour_type text NOT NULL DEFAULT 'field',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(employee_id, day_of_week, hour_type)
);

-- Create employee time off table for personal holidays/days off
CREATE TABLE public.employee_time_off (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  time_off_date date NOT NULL,
  name text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(employee_id, time_off_date)
);

-- Enable RLS
ALTER TABLE public.employee_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_time_off ENABLE ROW LEVEL SECURITY;

-- RLS policies for employee_availability
CREATE POLICY "Employees can manage their own availability"
ON public.employee_availability FOR ALL
USING (employee_id = auth.uid());

CREATE POLICY "Company admins can view employee availability"
ON public.employee_availability FOR SELECT
USING (company_id = get_user_company_id(auth.uid()) AND has_role(auth.uid(), 'company_admin'::app_role));

CREATE POLICY "Platform admins can view all employee availability"
ON public.employee_availability FOR SELECT
USING (has_role(auth.uid(), 'platform_admin'::app_role));

-- RLS policies for employee_time_off
CREATE POLICY "Employees can manage their own time off"
ON public.employee_time_off FOR ALL
USING (employee_id = auth.uid());

CREATE POLICY "Company admins can view employee time off"
ON public.employee_time_off FOR SELECT
USING (company_id = get_user_company_id(auth.uid()) AND has_role(auth.uid(), 'company_admin'::app_role));

CREATE POLICY "Platform admins can view all employee time off"
ON public.employee_time_off FOR SELECT
USING (has_role(auth.uid(), 'platform_admin'::app_role));

-- Indexes for performance
CREATE INDEX idx_employee_availability_employee_id ON public.employee_availability(employee_id);
CREATE INDEX idx_employee_availability_company_id ON public.employee_availability(company_id);
CREATE INDEX idx_employee_time_off_employee_id ON public.employee_time_off(employee_id);
CREATE INDEX idx_employee_time_off_date ON public.employee_time_off(time_off_date);