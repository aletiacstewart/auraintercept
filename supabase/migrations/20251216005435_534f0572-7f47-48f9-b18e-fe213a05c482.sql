-- Create table to store cost estimates
CREATE TABLE public.cost_estimates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Estimate',
  appointments_count INTEGER NOT NULL,
  reminders_per_appointment INTEGER NOT NULL DEFAULT 2,
  avg_transaction_value NUMERIC NOT NULL DEFAULT 0,
  channels_email BOOLEAN NOT NULL DEFAULT true,
  channels_sms BOOLEAN NOT NULL DEFAULT false,
  channels_voice BOOLEAN NOT NULL DEFAULT false,
  estimated_email_cost NUMERIC NOT NULL DEFAULT 0,
  estimated_sms_cost NUMERIC NOT NULL DEFAULT 0,
  estimated_voice_cost NUMERIC NOT NULL DEFAULT 0,
  estimated_stripe_cost NUMERIC NOT NULL DEFAULT 0,
  estimated_total_cost NUMERIC NOT NULL DEFAULT 0,
  month_year TEXT NOT NULL, -- Format: 'YYYY-MM'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cost_estimates ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Company admins can manage their cost estimates"
ON public.cost_estimates
FOR ALL
USING (company_id = get_user_company_id(auth.uid()) AND has_role(auth.uid(), 'company_admin'::app_role));

CREATE POLICY "Platform admins can view all cost estimates"
ON public.cost_estimates
FOR SELECT
USING (has_role(auth.uid(), 'platform_admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_cost_estimates_updated_at
BEFORE UPDATE ON public.cost_estimates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();