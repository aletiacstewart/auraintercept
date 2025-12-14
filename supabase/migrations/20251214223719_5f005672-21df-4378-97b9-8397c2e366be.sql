-- Create reminder_settings table for company customization
CREATE TABLE public.reminder_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL, -- '24h', '1h', '48h', '2h', etc.
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  hours_before INTEGER NOT NULL,
  sms_template TEXT NOT NULL DEFAULT 'Hi {customer_name}, this is a reminder for your {service_type} appointment at {company_name} on {date} at {time}.',
  call_enabled BOOLEAN NOT NULL DEFAULT false,
  call_template TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, reminder_type)
);

-- Enable RLS
ALTER TABLE public.reminder_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Company admins can manage reminder settings"
ON public.reminder_settings
FOR ALL
USING (company_id = get_user_company_id(auth.uid()) AND has_role(auth.uid(), 'company_admin'::app_role));

CREATE POLICY "Employees can view reminder settings"
ON public.reminder_settings
FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Platform admins can view all reminder settings"
ON public.reminder_settings
FOR SELECT
USING (has_role(auth.uid(), 'platform_admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_reminder_settings_updated_at
BEFORE UPDATE ON public.reminder_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_reminder_settings_company_id ON public.reminder_settings(company_id);