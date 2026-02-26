
## Security Fixes: Warn-Level Issues

### Issues to Fix

**1. RLS Policy Always True** (2 instances)
- `agent_performance_metrics` — policy `"Service role can manage metrics"` uses `USING (true) WITH CHECK (true)` for ALL operations
- `subscription_usage_tracking` — policy `"Service role can manage usage"` uses `USING (true) WITH CHECK (true)` for ALL operations

Fix: Replace the `true` policies with proper `auth.role() = 'service_role' OR has_role(auth.uid(), 'platform_admin')` conditions so only service role (edge functions) and platform admins can INSERT/UPDATE/DELETE these rows.

**2. Leaked Password Protection** (platform setting — cannot fix via SQL)
- Must be enabled in the backend auth settings. Will mark as noted with instructions for user.

**3. Unauthenticated Edge Functions** (active warn, not ignored)
- The `unauthenticated_functions` finding is still `ignore: false`. Review and document/ignore the remaining webhook functions that use alternative auth.

---

### Implementation Steps

1. **Database migration** — Drop the always-true policies on both tables and replace with properly scoped ones:
   - `agent_performance_metrics`: Allow INSERT/UPDATE/DELETE only for `service_role` or `platform_admin`
   - `subscription_usage_tracking`: Same scoped policy

2. **Mark `unauthenticated_functions` finding** — Update the security finding to `ignore: true` with a reason that all remaining `verify_jwt=false` functions use webhook signature auth (booking-actions, widget-api, etc.) which is documented alternative auth.

3. **Mark `SUPA_auth_leaked_password_protection`** — This is a toggle in the backend auth dashboard that cannot be changed via SQL or code. Will add a note and tell user how to enable it manually.

### Technical Details

**New policy SQL (replacing `USING (true)`):**
```sql
-- agent_performance_metrics
DROP POLICY "Service role can manage metrics" ON public.agent_performance_metrics;
CREATE POLICY "Service role can manage metrics" 
  ON public.agent_performance_metrics
  FOR ALL
  USING (auth.role() = 'service_role' OR has_role(auth.uid(), 'platform_admin'))
  WITH CHECK (auth.role() = 'service_role' OR has_role(auth.uid(), 'platform_admin'));

-- subscription_usage_tracking
DROP POLICY "Service role can manage usage" ON public.subscription_usage_tracking;
CREATE POLICY "Service role can manage usage"
  ON public.subscription_usage_tracking
  FOR ALL
  USING (auth.role() = 'service_role' OR has_role(auth.uid(), 'platform_admin'))
  WITH CHECK (auth.role() = 'service_role' OR has_role(auth.uid(), 'platform_admin'));
```
