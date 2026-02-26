
-- Fix always-true RLS policies on agent_performance_metrics
DROP POLICY IF EXISTS "Service role can manage metrics" ON public.agent_performance_metrics;
CREATE POLICY "Service role can manage metrics"
  ON public.agent_performance_metrics
  FOR ALL
  USING (auth.role() = 'service_role' OR public.has_role(auth.uid(), 'platform_admin'))
  WITH CHECK (auth.role() = 'service_role' OR public.has_role(auth.uid(), 'platform_admin'));

-- Fix always-true RLS policies on subscription_usage_tracking
DROP POLICY IF EXISTS "Service role can manage usage" ON public.subscription_usage_tracking;
CREATE POLICY "Service role can manage usage"
  ON public.subscription_usage_tracking
  FOR ALL
  USING (auth.role() = 'service_role' OR public.has_role(auth.uid(), 'platform_admin'))
  WITH CHECK (auth.role() = 'service_role' OR public.has_role(auth.uid(), 'platform_admin'));
