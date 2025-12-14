-- Create SMS templates table for per-company customization
CREATE TABLE public.sms_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  template_type text NOT NULL CHECK (template_type IN ('confirmation', 'cancellation', 'reminder')),
  message text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(company_id, template_type)
);

-- Enable RLS
ALTER TABLE public.sms_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Company admins can manage their SMS templates" 
ON public.sms_templates 
FOR ALL 
USING (company_id = get_user_company_id(auth.uid()) AND has_role(auth.uid(), 'company_admin'::app_role));

CREATE POLICY "Platform admins can view all SMS templates" 
ON public.sms_templates 
FOR SELECT 
USING (has_role(auth.uid(), 'platform_admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_sms_templates_updated_at
BEFORE UPDATE ON public.sms_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();