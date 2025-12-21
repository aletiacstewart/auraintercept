-- Phase 1: Public Access for Customer Portal

-- Allow anyone to view business hours (for customer portal/public widget)
CREATE POLICY "Anyone can view business hours" 
ON public.business_hours FOR SELECT 
USING (true);

-- Allow anyone to view active FAQs (for customer portal/public widget)
CREATE POLICY "Anyone can view active FAQs" 
ON public.faqs FOR SELECT 
USING (is_active = true);

-- Phase 2: Employee View Access

-- Allow employees to view SMS templates for their company
CREATE POLICY "Employees can view SMS templates" 
ON public.sms_templates FOR SELECT 
USING (company_id = get_user_company_id(auth.uid()));

-- Allow employees to view email templates for their company
CREATE POLICY "Employees can view email templates" 
ON public.email_templates FOR SELECT 
USING (company_id = get_user_company_id(auth.uid()));

-- Allow employees to view knowledge documents for their company
CREATE POLICY "Employees can view documents" 
ON public.knowledge_documents FOR SELECT 
USING (company_id = get_user_company_id(auth.uid()));

-- Phase 3: Customer Self-Service

-- Allow anyone to submit customer feedback (for public chat/portal)
CREATE POLICY "Anyone can submit feedback" 
ON public.customer_feedback FOR INSERT 
WITH CHECK (true);