---
name: Email Send Cap Guard
description: All Resend sends route through `_shared/email-guard.ts` which enforces 100/day + 3,000/month per company, logs to email_send_attempts, and notifies admins at 80%/100%
type: feature
---
# Resend Send Cap Enforcement

## Defaults
- 100 emails/day per company
- 3,000 emails/month per company
- Override per-company via `companies.email_caps` JSONB: `{"daily":150,"monthly":4000}`
- Override platform default via env `RESEND_DAILY_CAP` / `RESEND_MONTHLY_CAP`

## How edge functions send email
```ts
import { sendGuardedEmail } from '../_shared/email-guard.ts';
const result = await sendGuardedEmail({
  supabase, resendApiKey, companyId,
  to, from, subject, html,
  template: 'appointment_confirmation',
  priority: 'normal' | 'critical', // critical bypasses cap
});
if (!result.sent) { /* fall back to SMS / in-app */ }
```

## Database
- `email_usage_counters(company_id, period_type, period_key, count, cap)` — atomic per-period counters
- `email_send_attempts(...)` — append-only audit log (sent / blocked_daily / blocked_monthly / failed / overridden_critical)
- RPC `increment_email_usage(p_company_id, p_daily_cap, p_monthly_cap)` — SECURITY DEFINER, atomic check-and-increment

## Client-invoked send
Edge function `send-email-guarded` (verify_jwt=false) accepts `{ companyId, to, from, subject, html, template, priority }` and runs through the same guard.

## UI
- `/dashboard/email-limits` — usage progress bars + recent attempts (linked from Notification Settings page)
- Hook: `useEmailUsage(companyId)`

## Critical-priority bypass list
Use `priority: 'critical'` for: cancellations, password reset, payment receipts, OTP. These ALWAYS send and are logged as `overridden_critical`.

## Already migrated
- send-appointment-email (cancellation = critical, others = normal)

## TODO migration list (still call Resend directly, route through guard when touched)
- weekly-digest, monthly-digest, quarterly-digest
- send-job-notification, send-review-request
- trial-reminders, appointment-reminders
- lead-follow-up-reminders, check-unsubscribe-alerts, cost-alerts
