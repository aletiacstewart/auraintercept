-- Create customer_feedback table to track feedback submissions
CREATE TABLE public.customer_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  feedback_note TEXT,
  service_type TEXT,
  employee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  source TEXT DEFAULT 'chat', -- chat, widget, sms, email, voice
  review_link_clicked TEXT, -- google, facebook, yelp, or null
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customer_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Company admins can manage feedback"
ON public.customer_feedback
FOR ALL
USING (company_id = get_user_company_id(auth.uid()) AND has_role(auth.uid(), 'company_admin'::app_role));

CREATE POLICY "Employees can view feedback"
ON public.customer_feedback
FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Platform admins can view all feedback"
ON public.customer_feedback
FOR SELECT
USING (has_role(auth.uid(), 'platform_admin'::app_role));

-- Create index for faster queries
CREATE INDEX idx_customer_feedback_company_id ON public.customer_feedback(company_id);
CREATE INDEX idx_customer_feedback_created_at ON public.customer_feedback(created_at DESC);