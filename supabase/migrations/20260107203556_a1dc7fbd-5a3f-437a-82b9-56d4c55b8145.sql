-- Create customer_technician_history table for tracking customer-technician relationships
CREATE TABLE public.customer_technician_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  customer_email TEXT,
  customer_phone TEXT,
  technician_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_count INTEGER DEFAULT 1,
  last_service_at TIMESTAMPTZ DEFAULT now(),
  customer_rating INTEGER CHECK (customer_rating >= 1 AND customer_rating <= 5),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_customer_tech_email UNIQUE (company_id, customer_email, technician_id),
  CONSTRAINT unique_customer_tech_phone UNIQUE (company_id, customer_phone, technician_id),
  CONSTRAINT customer_identifier_required CHECK (customer_email IS NOT NULL OR customer_phone IS NOT NULL)
);

-- Add location fields to profiles for technician home base
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS home_latitude NUMERIC,
ADD COLUMN IF NOT EXISTS home_longitude NUMERIC,
ADD COLUMN IF NOT EXISTS home_address TEXT,
ADD COLUMN IF NOT EXISTS current_latitude NUMERIC,
ADD COLUMN IF NOT EXISTS current_longitude NUMERIC,
ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMPTZ;

-- Add location fields to customer_profiles for cached geocoding
ALTER TABLE public.customer_profiles 
ADD COLUMN IF NOT EXISTS latitude NUMERIC,
ADD COLUMN IF NOT EXISTS longitude NUMERIC;

-- Add assignment settings to companies
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS assignment_use_load_balancing BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS assignment_use_distance_routing BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS assignment_use_customer_history BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS assignment_workload_weight INTEGER DEFAULT 40,
ADD COLUMN IF NOT EXISTS assignment_distance_weight INTEGER DEFAULT 35,
ADD COLUMN IF NOT EXISTS assignment_history_weight INTEGER DEFAULT 25,
ADD COLUMN IF NOT EXISTS assignment_max_distance_miles INTEGER DEFAULT 50;

-- Enable RLS on customer_technician_history
ALTER TABLE public.customer_technician_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for customer_technician_history
CREATE POLICY "Company admins can view their history"
ON public.customer_technician_history
FOR SELECT
USING (
  company_id = public.get_user_company_id(auth.uid())
  AND (public.has_role(auth.uid(), 'company_admin') OR public.has_role(auth.uid(), 'platform_admin'))
);

CREATE POLICY "Company admins can insert history"
ON public.customer_technician_history
FOR INSERT
WITH CHECK (
  company_id = public.get_user_company_id(auth.uid())
  AND (public.has_role(auth.uid(), 'company_admin') OR public.has_role(auth.uid(), 'platform_admin'))
);

CREATE POLICY "Company admins can update history"
ON public.customer_technician_history
FOR UPDATE
USING (
  company_id = public.get_user_company_id(auth.uid())
  AND (public.has_role(auth.uid(), 'company_admin') OR public.has_role(auth.uid(), 'platform_admin'))
);

CREATE POLICY "Service role can manage history"
ON public.customer_technician_history
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

-- Index for fast lookups
CREATE INDEX idx_customer_tech_history_lookup 
ON public.customer_technician_history(company_id, customer_email, customer_phone);

CREATE INDEX idx_customer_tech_history_technician 
ON public.customer_technician_history(technician_id);

-- Trigger to update customer_technician_history when job is completed
CREATE OR REPLACE FUNCTION public.update_customer_technician_history()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_appointment RECORD;
BEGIN
  -- Only act when status changes to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') AND NEW.employee_id IS NOT NULL THEN
    -- Get appointment details
    SELECT * INTO v_appointment FROM public.appointments WHERE id = NEW.appointment_id;
    
    IF v_appointment.customer_email IS NOT NULL THEN
      INSERT INTO public.customer_technician_history (
        company_id,
        customer_email,
        customer_phone,
        technician_id,
        service_count,
        last_service_at
      ) VALUES (
        NEW.company_id,
        v_appointment.customer_email,
        v_appointment.customer_phone,
        NEW.employee_id,
        1,
        now()
      )
      ON CONFLICT (company_id, customer_email, technician_id) 
      DO UPDATE SET 
        service_count = customer_technician_history.service_count + 1,
        last_service_at = now(),
        updated_at = now();
    ELSIF v_appointment.customer_phone IS NOT NULL THEN
      INSERT INTO public.customer_technician_history (
        company_id,
        customer_email,
        customer_phone,
        technician_id,
        service_count,
        last_service_at
      ) VALUES (
        NEW.company_id,
        NULL,
        v_appointment.customer_phone,
        NEW.employee_id,
        1,
        now()
      )
      ON CONFLICT (company_id, customer_phone, technician_id) 
      DO UPDATE SET 
        service_count = customer_technician_history.service_count + 1,
        last_service_at = now(),
        updated_at = now();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on job_assignments
DROP TRIGGER IF EXISTS trigger_update_customer_technician_history ON public.job_assignments;
CREATE TRIGGER trigger_update_customer_technician_history
AFTER UPDATE ON public.job_assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_customer_technician_history();