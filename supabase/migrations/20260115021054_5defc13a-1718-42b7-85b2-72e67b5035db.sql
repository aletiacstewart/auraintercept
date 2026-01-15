-- Create audit log table for token-based appointment access
CREATE TABLE IF NOT EXISTS public.appointment_access_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
  customer_token UUID,
  access_type TEXT NOT NULL,
  client_ip TEXT,
  user_agent TEXT,
  accessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  success BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB
);

-- Enable RLS
ALTER TABLE public.appointment_access_logs ENABLE ROW LEVEL SECURITY;

-- Only company admins can view access logs
CREATE POLICY "Company admins can view access logs" 
  ON public.appointment_access_logs 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.id = appointment_access_logs.appointment_id
      AND can_view_company(a.company_id)
    )
  );

-- Add index for efficient querying
CREATE INDEX idx_appointment_access_logs_token ON public.appointment_access_logs(customer_token);
CREATE INDEX idx_appointment_access_logs_appointment ON public.appointment_access_logs(appointment_id);
CREATE INDEX idx_appointment_access_logs_accessed_at ON public.appointment_access_logs(accessed_at DESC);

-- Create function to rotate customer token after appointment completion
CREATE OR REPLACE FUNCTION public.rotate_customer_token_on_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- When status changes to 'completed', rotate the token after 7 days
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Generate new token that will expire access after the 7-day window
    NEW.customer_token := gen_random_uuid();
    NEW.updated_at := now();
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for token rotation
DROP TRIGGER IF EXISTS rotate_token_on_completion ON public.appointments;
CREATE TRIGGER rotate_token_on_completion
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.rotate_customer_token_on_completion();

-- Create RPC function to log appointment access (callable from edge functions)
CREATE OR REPLACE FUNCTION public.log_appointment_access(
  p_appointment_id UUID,
  p_customer_token UUID,
  p_access_type TEXT,
  p_client_ip TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_success BOOLEAN DEFAULT true,
  p_metadata JSONB DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.appointment_access_logs (
    appointment_id,
    customer_token,
    access_type,
    client_ip,
    user_agent,
    success,
    metadata
  ) VALUES (
    p_appointment_id,
    p_customer_token,
    p_access_type,
    p_client_ip,
    p_user_agent,
    p_success,
    p_metadata
  );
END;
$$;

-- Grant execute to anon for edge function access
GRANT EXECUTE ON FUNCTION public.log_appointment_access TO anon;
GRANT EXECUTE ON FUNCTION public.log_appointment_access TO authenticated;