-- Create call_logs table
CREATE TABLE public.call_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  direction text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  status text NOT NULL DEFAULT 'initiated',
  from_number text,
  to_number text,
  customer_name text,
  customer_phone text,
  call_sid text UNIQUE,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  answered_at timestamp with time zone,
  ended_at timestamp with time zone,
  duration_seconds integer,
  purpose text,
  transcript jsonb DEFAULT '[]'::jsonb,
  summary text,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  employee_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Company admins can view all company calls"
ON public.call_logs FOR SELECT
USING (company_id = get_user_company_id(auth.uid()) AND has_role(auth.uid(), 'company_admin'::app_role));

CREATE POLICY "Employees can view their own calls"
ON public.call_logs FOR SELECT
USING (employee_id = auth.uid());

CREATE POLICY "Platform admins can view all calls"
ON public.call_logs FOR SELECT
USING (has_role(auth.uid(), 'platform_admin'::app_role));

-- Index for efficient queries
CREATE INDEX idx_call_logs_company_date ON public.call_logs (company_id, started_at DESC);
CREATE INDEX idx_call_logs_call_sid ON public.call_logs (call_sid);

-- Trigger for updated_at
CREATE TRIGGER update_call_logs_updated_at
BEFORE UPDATE ON public.call_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for call logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_logs;