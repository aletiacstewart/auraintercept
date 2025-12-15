-- Create digest_delivery_logs table
CREATE TABLE public.digest_delivery_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  digest_type TEXT NOT NULL CHECK (digest_type IN ('weekly', 'monthly', 'quarterly')),
  recipient_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed')),
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.digest_delivery_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Company admins can view their digest logs"
ON public.digest_delivery_logs
FOR SELECT
USING (company_id = get_user_company_id(auth.uid()) AND has_role(auth.uid(), 'company_admin'::app_role));

CREATE POLICY "Platform admins can view all digest logs"
ON public.digest_delivery_logs
FOR SELECT
USING (has_role(auth.uid(), 'platform_admin'::app_role));

-- Create index for efficient querying
CREATE INDEX idx_digest_delivery_logs_company_id ON public.digest_delivery_logs(company_id);
CREATE INDEX idx_digest_delivery_logs_sent_at ON public.digest_delivery_logs(sent_at DESC);