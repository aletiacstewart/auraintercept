-- Create job_assignments table for tracking technician job workflow
CREATE TABLE public.job_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending_acceptance',
  assigned_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  en_route_at TIMESTAMPTZ,
  arrived_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  customer_address TEXT,
  customer_lat NUMERIC,
  customer_lng NUMERIC,
  technician_lat NUMERIC,
  technician_lng NUMERIC,
  estimated_arrival_minutes INTEGER,
  actual_arrival_minutes INTEGER,
  notes TEXT,
  decline_reason TEXT,
  customer_notified_assigned BOOLEAN DEFAULT false,
  customer_notified_en_route BOOLEAN DEFAULT false,
  customer_notified_arrived BOOLEAN DEFAULT false,
  customer_notified_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add check constraint for valid status values
ALTER TABLE public.job_assignments 
ADD CONSTRAINT job_assignments_status_check 
CHECK (status IN ('pending_acceptance', 'accepted', 'declined', 'en_route', 'arrived', 'in_progress', 'completed', 'cancelled'));

-- Enable RLS
ALTER TABLE public.job_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Employees can view their own job assignments"
ON public.job_assignments FOR SELECT
USING (employee_id = auth.uid());

CREATE POLICY "Employees can update their own job assignments"
ON public.job_assignments FOR UPDATE
USING (employee_id = auth.uid());

CREATE POLICY "Company admins can view all job assignments"
ON public.job_assignments FOR SELECT
USING (company_id = get_user_company_id(auth.uid()) AND has_role(auth.uid(), 'company_admin'));

CREATE POLICY "Company admins can manage job assignments"
ON public.job_assignments FOR ALL
USING (company_id = get_user_company_id(auth.uid()) AND has_role(auth.uid(), 'company_admin'));

CREATE POLICY "Platform admins can view all job assignments"
ON public.job_assignments FOR SELECT
USING (has_role(auth.uid(), 'platform_admin'));

CREATE POLICY "Platform admins can manage all job assignments"
ON public.job_assignments FOR ALL
USING (has_role(auth.uid(), 'platform_admin'));

-- Create index for performance
CREATE INDEX idx_job_assignments_employee_status ON public.job_assignments(employee_id, status);
CREATE INDEX idx_job_assignments_company_status ON public.job_assignments(company_id, status);
CREATE INDEX idx_job_assignments_appointment ON public.job_assignments(appointment_id);

-- Enable realtime for job_assignments
ALTER PUBLICATION supabase_realtime ADD TABLE public.job_assignments;

-- Create trigger for updated_at
CREATE TRIGGER update_job_assignments_updated_at
BEFORE UPDATE ON public.job_assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add notification preferences to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS sms_notifications_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS phone_number TEXT;