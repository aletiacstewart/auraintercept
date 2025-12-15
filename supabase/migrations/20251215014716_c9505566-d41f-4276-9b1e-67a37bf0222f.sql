-- Create suppressed emails table
CREATE TABLE public.suppressed_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  reason TEXT NOT NULL,
  suppressed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  source_event_id TEXT,
  UNIQUE(company_id, email)
);

-- Enable RLS
ALTER TABLE public.suppressed_emails ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Company admins can view suppressed emails"
ON public.suppressed_emails
FOR SELECT
USING (company_id = get_user_company_id(auth.uid()) AND has_role(auth.uid(), 'company_admin'::app_role));

CREATE POLICY "Platform admins can view all suppressed emails"
ON public.suppressed_emails
FOR SELECT
USING (has_role(auth.uid(), 'platform_admin'::app_role));

CREATE POLICY "Company admins can delete suppressed emails"
ON public.suppressed_emails
FOR DELETE
USING (company_id = get_user_company_id(auth.uid()) AND has_role(auth.uid(), 'company_admin'::app_role));

-- Create index for faster lookups
CREATE INDEX idx_suppressed_emails_company_email ON public.suppressed_emails(company_id, email);