-- Service-only access rules for internal tables that had RLS enabled but no policies.
CREATE POLICY "Service role manages oauth state nonces"
ON public.oauth_state_nonces FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role manages cron shared secret"
ON public._cron_shared_secret FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Close stale frontend-error alerts that are no longer actionable.
UPDATE public.platform_issues
SET status = 'resolved', resolved_at = now()
WHERE status = 'new'
  AND created_at < now() - interval '30 days';