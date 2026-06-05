-- 1. call-recordings bucket: restrict upload to service_role
DROP POLICY IF EXISTS "Service role can upload recordings" ON storage.objects;
CREATE POLICY "Service role can upload recordings"
ON storage.objects FOR INSERT TO service_role
WITH CHECK (bucket_id = 'call-recordings');

-- 2. invoice_line_items / quote_line_items: require billing access
DROP POLICY IF EXISTS "Invoice line items follow invoice access" ON public.invoice_line_items;
CREATE POLICY "Invoice line items follow invoice access"
ON public.invoice_line_items FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_line_items.invoice_id AND i.company_id = public.get_user_company_id(auth.uid()) AND public.has_billing_access(auth.uid())))
WITH CHECK (EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_line_items.invoice_id AND i.company_id = public.get_user_company_id(auth.uid()) AND public.has_billing_access(auth.uid())));

DROP POLICY IF EXISTS "Quote line items follow quote access" ON public.quote_line_items;
CREATE POLICY "Quote line items follow quote access"
ON public.quote_line_items FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.quotes q WHERE q.id = quote_line_items.quote_id AND q.company_id = public.get_user_company_id(auth.uid()) AND public.has_billing_access(auth.uid())))
WITH CHECK (EXISTS (SELECT 1 FROM public.quotes q WHERE q.id = quote_line_items.quote_id AND q.company_id = public.get_user_company_id(auth.uid()) AND public.has_billing_access(auth.uid())));

-- 3. demo_trials: explicit INSERT lock
DROP POLICY IF EXISTS "Only platform admins can insert demo trials" ON public.demo_trials;
CREATE POLICY "Only platform admins can insert demo trials"
ON public.demo_trials FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'platform_admin'::public.app_role));

-- 4. companies: drop duplicate member read policy
DROP POLICY IF EXISTS companies_read ON public.companies;

-- 5. appointment_access_logs: explicit service_role INSERT
DROP POLICY IF EXISTS "Service role can insert appointment access logs" ON public.appointment_access_logs;
CREATE POLICY "Service role can insert appointment access logs"
ON public.appointment_access_logs FOR INSERT TO service_role
WITH CHECK (true);