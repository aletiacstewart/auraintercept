-- Create reminder logs table
CREATE TABLE public.reminder_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL, -- '24h', '1h', etc.
  channel TEXT NOT NULL, -- 'sms' or 'email'
  status TEXT NOT NULL DEFAULT 'sent', -- 'sent', 'failed', 'skipped'
  recipient TEXT, -- phone number or email
  message_preview TEXT, -- first 100 chars of message
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reminder_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Company admins can view their reminder logs"
ON public.reminder_logs
FOR SELECT
USING (company_id = get_user_company_id(auth.uid()) AND has_role(auth.uid(), 'company_admin'::app_role));

CREATE POLICY "Platform admins can view all reminder logs"
ON public.reminder_logs
FOR SELECT
USING (has_role(auth.uid(), 'platform_admin'::app_role));

-- Create index for faster queries
CREATE INDEX idx_reminder_logs_company_created ON public.reminder_logs(company_id, created_at DESC);
CREATE INDEX idx_reminder_logs_appointment ON public.reminder_logs(appointment_id);