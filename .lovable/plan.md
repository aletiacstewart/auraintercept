## Wire remaining email functions through the cap guard

Migrate the 10 remaining email-sending edge functions to route through `sendGuardedEmail()` so all outbound mail counts toward (and is blocked by) the 100/day · 3,000/month Resend cap.

### Functions to migrate

**Digests (highest volume — biggest leak today):**
1. `weekly-digest`
2. `monthly-digest`
3. `quarterly-digest`

**Lifecycle / transactional:**
4. `send-job-email` — job status updates
5. `send-review-request` — post-job review asks
6. `send-trial-emails` — trial day-X nudges
7. `send-appointment-reminders` — 24h / 1h reminders
8. `send-lead-followup` — lead nurture
9. `send-cost-alerts` — admin cost warnings
10. `send-unsubscribe-alert` — unsubscribe notifications

### Per-function changes

For each function:
- Replace direct `fetch("https://api.resend.com/emails", …)` (or Resend SDK) calls with `sendGuardedEmail({ companyId, to, subject, html, templateName, priority })` from `_shared/email-guard.ts`.
- Resolve `companyId` from the function's existing context (job → `jobs.company_id`, digest → loop arg, trial → `companies.id`, cost-alert → admin's company, etc.).
- Assign `priority`:
  - `critical` → `send-cost-alerts` (admins must see overage warnings even at cap), `send-unsubscribe-alert` (compliance), `send-trial-emails` *only* for trial-ending / payment-required messages.
  - `normal` → everything else (digests, reminders, reviews, follow-ups, job status, generic trial nudges).
- Preserve existing template HTML, subject lines, and recipient logic — only the transport layer changes.
- On `{ allowed: false }` return: log + skip (guard already writes to `email_send_attempts`); do NOT throw, so digest loops keep iterating.

### No DB / frontend changes
- Schema, RPC, caps page, and hooks from the previous step stay as-is.
- No new env vars.

### Verification
- Deploy all 10 functions.
- Tail logs for one digest run → confirm `email_send_attempts` rows appear with correct `template_name` and `status`.
- Manually invoke `send-cost-alerts` after forcing counter to cap → expect `status: 'overridden_critical'`.
- Manually invoke `send-review-request` after cap → expect `status: 'blocked_daily'` and no Resend call.
- Open `/dashboard/email-limits` → counters reflect digest send.

### Out of scope
- SignalWire / ElevenLabs caps.
- Per-recipient throttling.
- Retry/backoff on blocked sends (drops are intentional at cap).
