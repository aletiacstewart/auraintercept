## Goal
Enforce Resend send caps platform-wide: **3,000 emails/month** and **100 emails/day**, with graceful fallback + admin notifications.

## Approach
Centralize all outbound email through a single edge function (`send-email-guarded`) that checks usage counters before calling Resend. Every existing email-sending function (`send-appointment-email`, `weekly-digest`, `monthly-digest`, `quarterly-digest`, `send-job-notification`, `send-review-request`, `cost-alerts`, `trial-reminders`, `appointment-reminders`, etc.) routes through it.

## Database (new migration)

`email_usage_counters` table:
- `id` (uuid pk)
- `company_id` (uuid, nullable — null = platform-wide)
- `period_type` ('day' | 'month')
- `period_key` (text, e.g. `2026-05-09` or `2026-05`)
- `count` (int, default 0)
- `cap` (int)
- `created_at`, `updated_at`
- unique(company_id, period_type, period_key)

`email_send_attempts` table (audit log):
- id, company_id, to_email, template, status ('sent'|'blocked_daily'|'blocked_monthly'|'failed'), reason, created_at

RPC `increment_email_usage(company_id, daily_cap, monthly_cap)`:
- Atomic upsert + check; returns `{ allowed: bool, reason: text, daily_count, monthly_count }`
- SECURITY DEFINER

RLS: only platform_admin can read counters via UI; service role full access.

## Edge function: `send-email-guarded`
Inputs: `{ to, subject, html, template, company_id?, priority? ('critical'|'normal') }`
Logic:
1. Read caps from env (`RESEND_DAILY_CAP=100`, `RESEND_MONTHLY_CAP=3000`) — overridable per-company in `companies.email_caps` JSONB.
2. Call `increment_email_usage` RPC.
3. If blocked:
   - Log attempt as `blocked_*`
   - If `priority='critical'` → still send (overrides cap, logs warning)
   - Else → return `{ sent: false, reason }`
   - Trigger `cost-alerts` notification at 80% / 95% / 100% thresholds (once per period)
4. If allowed → call Resend, log `sent`.

## Refactor existing email functions
Each existing function replaces its direct Resend `fetch` with `supabase.functions.invoke('send-email-guarded', {...})`. Critical transactional emails (password reset, OTP, payment receipts) tagged `priority: 'critical'`. Marketing/digests stay `normal`.

## Frontend additions

**Settings → Notifications & Limits page** (platform_admin only):
- Show current month/day usage with progress bars
- Show cap settings (read-only env-driven default, editable per-company)
- Show recent blocked sends
- Toggle: "When email cap reached, notify admins via SMS instead"

**Notification triggers** (reuse existing `useStaffNotifications`):
- 80% daily/monthly → in-app + email warning to platform_admin
- 100% → in-app + SMS via SignalWire (uses existing notification system)
- Blocked send → bell badge

## Fallback strategy when capped
- Customer-facing flows: show "Email temporarily unavailable — we'll text you instead" + auto-fallback to SMS when phone present
- Internal notifications: queue to in-app bell only
- Critical (auth, payments): always send (override flag)

## Files to add
- `supabase/migrations/<ts>_email_usage_caps.sql`
- `supabase/functions/send-email-guarded/index.ts`
- `src/pages/settings/EmailLimits.tsx`
- `src/hooks/useEmailUsage.ts`

## Files to edit (route through guard)
- `supabase/functions/send-appointment-email/index.ts`
- `supabase/functions/send-job-notification/index.ts`
- `supabase/functions/send-review-request/index.ts`
- `supabase/functions/weekly-digest/index.ts`
- `supabase/functions/monthly-digest/index.ts`
- `supabase/functions/quarterly-digest/index.ts`
- `supabase/functions/trial-reminders/index.ts`
- `supabase/functions/appointment-reminders/index.ts`
- `supabase/functions/cost-alerts/index.ts`
- `supabase/functions/lead-follow-up-reminders/index.ts`
- `supabase/functions/check-unsubscribe-alerts/index.ts`
- `src/pages/Settings.tsx` (add Email Limits tab)

## Verification
- Manually call `send-email-guarded` 101 times with same `company_id` → 101st returns `blocked_daily`
- Check `email_send_attempts` shows correct status
- Check progress bar in Settings
- Trigger 80% threshold → verify staff notification fires once

## Out of scope
- SignalWire SMS caps (separate request — same pattern would apply)
- ElevenLabs minute caps (already discussed earlier)
- Per-recipient rate limiting (e.g. don't email same user 10x/hr)
