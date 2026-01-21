-- Add demo company phone numbers for "Call to Book" fallback
UPDATE companies SET dispatch_phone = '+1-555-0100' WHERE dispatch_phone IS NULL;

-- Tighten public INSERT policies on site tables to require valid website_id

-- Fix site_metrics INSERT policy (uses company_id)
DROP POLICY IF EXISTS "System can insert site metrics" ON public.site_metrics;
CREATE POLICY "Validated inserts for site metrics" ON public.site_metrics
  FOR INSERT WITH CHECK (
    company_id IS NOT NULL 
    AND EXISTS (SELECT 1 FROM public.companies WHERE id = company_id)
  );

-- Fix site_visitor_logs INSERT policy (uses website_id)
DROP POLICY IF EXISTS "Anyone can insert visitor logs" ON public.site_visitor_logs;
CREATE POLICY "Validated inserts for visitor logs" ON public.site_visitor_logs
  FOR INSERT WITH CHECK (
    website_id IS NOT NULL 
    AND EXISTS (SELECT 1 FROM public.smart_websites WHERE id = website_id)
  );

-- Fix site_chat_logs INSERT policy (uses website_id)
DROP POLICY IF EXISTS "Allow anonymous chat log inserts" ON public.site_chat_logs;
CREATE POLICY "Validated inserts for chat logs" ON public.site_chat_logs
  FOR INSERT WITH CHECK (
    website_id IS NOT NULL 
    AND EXISTS (SELECT 1 FROM public.smart_websites WHERE id = website_id)
  );