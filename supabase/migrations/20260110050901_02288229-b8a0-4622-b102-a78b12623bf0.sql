-- Create leads table for AI agent lead capture
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  source TEXT NOT NULL,
  channel TEXT,
  service_interest TEXT,
  intent TEXT,
  notes TEXT,
  status TEXT DEFAULT 'new',
  priority TEXT DEFAULT 'normal',
  conversation_id UUID,
  converted_to_customer_id UUID REFERENCES public.customer_profiles(id),
  converted_to_appointment_id UUID REFERENCES public.appointments(id),
  follow_up_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for efficient queries
CREATE INDEX idx_leads_company_status ON public.leads(company_id, status);
CREATE INDEX idx_leads_company_created ON public.leads(company_id, created_at DESC);
CREATE INDEX idx_leads_company_priority ON public.leads(company_id, priority);
CREATE INDEX idx_leads_source ON public.leads(source);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- RLS Policies using user_roles table
CREATE POLICY "Company users can view their leads"
ON public.leads FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id = p.id
    WHERE p.id = auth.uid()
    AND p.company_id = leads.company_id
    AND ur.role IN ('company_admin', 'platform_admin')
  )
);

CREATE POLICY "Company users can insert leads"
ON public.leads FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id = p.id
    WHERE p.id = auth.uid()
    AND p.company_id = leads.company_id
    AND ur.role IN ('company_admin', 'platform_admin')
  )
);

CREATE POLICY "Company users can update their leads"
ON public.leads FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id = p.id
    WHERE p.id = auth.uid()
    AND p.company_id = leads.company_id
    AND ur.role IN ('company_admin', 'platform_admin')
  )
);

CREATE POLICY "Company users can delete their leads"
ON public.leads FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id = p.id
    WHERE p.id = auth.uid()
    AND p.company_id = leads.company_id
    AND ur.role IN ('company_admin', 'platform_admin')
  )
);

-- Service role policy for edge functions
CREATE POLICY "Service role full access to leads"
ON public.leads FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

-- Create trigger for updated_at
CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for leads
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;