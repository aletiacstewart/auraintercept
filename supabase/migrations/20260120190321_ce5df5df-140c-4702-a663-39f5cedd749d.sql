-- ================================================
-- TIGHTEN SITE ANALYTICS POLICIES
-- These tables collect website analytics and need public insert but controlled update
-- ================================================

-- site_metrics: Tighten UPDATE to only allow from service role (edge functions)
DROP POLICY IF EXISTS "System can update site metrics" ON public.site_metrics;

-- site_metrics: Allow inserts but no public updates (updates happen via edge functions with service role)
-- INSERT policies are fine for anonymous tracking

-- site_chat_logs: These are intentionally public insert for chat widget
-- No change needed - this is expected behavior for public chat

-- site_visitor_logs: These are intentionally public insert for analytics
-- No change needed - this is expected behavior for analytics tracking

-- Note: The remaining "USING (true)" warnings are for INSERT policies which 
-- the linter incorrectly flags. INSERT policies use WITH CHECK, not USING.
-- These are false positives for public analytics tables.