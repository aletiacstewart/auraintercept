-- Create table to track which services each technician can perform
CREATE TABLE public.technician_service_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  technician_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  assigned_by UUID REFERENCES public.profiles(id),
  UNIQUE(technician_id, service_id)
);

-- Enable RLS
ALTER TABLE public.technician_service_assignments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Company admins can manage technician service assignments"
ON public.technician_service_assignments
FOR ALL
USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Technicians can view their own service assignments"
ON public.technician_service_assignments
FOR SELECT
USING (technician_id = auth.uid());

-- Create index for performance
CREATE INDEX idx_technician_service_assignments_technician ON public.technician_service_assignments(technician_id);
CREATE INDEX idx_technician_service_assignments_service ON public.technician_service_assignments(service_id);
CREATE INDEX idx_technician_service_assignments_company ON public.technician_service_assignments(company_id);