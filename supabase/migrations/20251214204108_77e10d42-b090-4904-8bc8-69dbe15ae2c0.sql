-- Create services table for company service offerings
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  price DECIMAL(10,2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create FAQs table
CREATE TABLE public.faqs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create business hours table
CREATE TABLE public.business_hours (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  open_time TIME,
  close_time TIME,
  is_closed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, day_of_week)
);

-- Create knowledge documents table
CREATE TABLE public.knowledge_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  content_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;

-- Services policies
CREATE POLICY "Company admins can manage services"
ON public.services FOR ALL
USING (company_id = get_user_company_id(auth.uid()) AND has_role(auth.uid(), 'company_admin'));

CREATE POLICY "Employees can view services"
ON public.services FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Platform admins can view all services"
ON public.services FOR SELECT
USING (has_role(auth.uid(), 'platform_admin'));

-- FAQs policies
CREATE POLICY "Company admins can manage FAQs"
ON public.faqs FOR ALL
USING (company_id = get_user_company_id(auth.uid()) AND has_role(auth.uid(), 'company_admin'));

CREATE POLICY "Employees can view FAQs"
ON public.faqs FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Platform admins can view all FAQs"
ON public.faqs FOR SELECT
USING (has_role(auth.uid(), 'platform_admin'));

-- Business hours policies
CREATE POLICY "Company admins can manage business hours"
ON public.business_hours FOR ALL
USING (company_id = get_user_company_id(auth.uid()) AND has_role(auth.uid(), 'company_admin'));

CREATE POLICY "Employees can view business hours"
ON public.business_hours FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Platform admins can view all business hours"
ON public.business_hours FOR SELECT
USING (has_role(auth.uid(), 'platform_admin'));

-- Knowledge documents policies
CREATE POLICY "Company admins can manage documents"
ON public.knowledge_documents FOR ALL
USING (company_id = get_user_company_id(auth.uid()) AND has_role(auth.uid(), 'company_admin'));

CREATE POLICY "Platform admins can view all documents"
ON public.knowledge_documents FOR SELECT
USING (has_role(auth.uid(), 'platform_admin'));

-- Create storage bucket for knowledge documents
INSERT INTO storage.buckets (id, name, public) VALUES ('knowledge-docs', 'knowledge-docs', false);

-- Storage policies
CREATE POLICY "Company admins can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'knowledge-docs' AND (storage.foldername(name))[1] = get_user_company_id(auth.uid())::text);

CREATE POLICY "Company admins can view their documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'knowledge-docs' AND (storage.foldername(name))[1] = get_user_company_id(auth.uid())::text);

CREATE POLICY "Company admins can delete their documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'knowledge-docs' AND (storage.foldername(name))[1] = get_user_company_id(auth.uid())::text);

-- Add triggers for updated_at
CREATE TRIGGER update_services_updated_at
BEFORE UPDATE ON public.services
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_faqs_updated_at
BEFORE UPDATE ON public.faqs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_business_hours_updated_at
BEFORE UPDATE ON public.business_hours
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_knowledge_documents_updated_at
BEFORE UPDATE ON public.knowledge_documents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();