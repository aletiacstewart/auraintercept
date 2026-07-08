## Status check vs. Claude's audit

Good news: **3 of the 4 fixes are already in place** in the codebase from an earlier turn — `send-email-guarded`, `send-appointment-sms`, and `send-staff-notification` all already import and call `authorizeInternalRequest(req, companyId)`. `send-email-guarded` also already restricts `priority: 'critical'` to service callers, and `outbound-call` is already wired too.

**But I found one real gap Claude's audit did not flag**, caused by adding the auth check to `send-staff-notification`:

- `supabase/functions/booking-actions/index.ts` (line ~605) calls `send-staff-notification` via a raw `fetch(...)` **without any `Authorization` header**. Before the auth check, that worked. Now it will silently 401 on every new booking — staff will stop getting "New Appointment Booked" alerts.
- `verify-insurance` and `send-campaign` are fine — they use `supabase.functions.invoke` on a service-role client, which forwards the service-role bearer automatically and hits the `isService` fast path.

## What this plan does

1. **Fix the regression in `booking-actions`** — add `Authorization: Bearer ${serviceRoleKey}` to the `send-staff-notification` fetch (mirroring the pattern already used a few lines down for the `ai-orchestrator` call).
2. **Verify all four functions end-to-end** with curl + a dashboard smoke test against the acceptance checklist Claude provided, so we have proof instead of just "the import is there".
3. **No re-implementation** of Fixes 1–4 — they are already committed. I'll re-read each one and only touch it if something is actually missing or wrong.

## My additional suggestions (small, aligned with Claude)

- **Add a stub for `verify-insurance`**: it currently relies on `supabase.functions.invoke` forwarding the service key. That's fragile — if someone ever swaps that client to an anon-key client, staff notifications silently break with 401. Suggest passing an explicit `Authorization` header the same way `booking-actions` will, so the intent is obvious. Low risk, keeps future refactors safe.
- **`outbound-call` currently has `verify_jwt = true`** in `supabase/config.toml`. That's fine (defense in depth), but it means an internal service-to-server caller would also need to send a bearer. No callers do that today, so no action needed — just flagging so we don't get surprised later if we add one.
- **Do not** change `send-staff-notification` to service-only. Claude's rationale (future "send test notification" dashboard button) is correct; leave the full user-JWT+company-scope check in place.

## Files touched

- `supabase/functions/booking-actions/index.ts` — add `Authorization` header to the `send-staff-notification` fetch (one small edit around line 605).
- `supabase/functions/verify-insurance/index.ts` — optional: switch the `send-staff-notification` invoke to include an explicit service-role Authorization header for clarity.
- No changes to the four target functions unless verification uncovers a gap.

## Verification (must all pass before I call this done)

For each of `send-email-guarded`, `send-appointment-sms`, `outbound-call`, `send-staff-notification`:

- `curl` with **no** `Authorization` → `401`.
- `curl` with `Authorization: Bearer <anon key>` and a valid `companyId` → `401`/`403`.
- `curl` with `Authorization: Bearer <service role>` → succeeds (or reaches provider).

Plus:

- Trigger a booking through `booking-actions` end-to-end and confirm a `staff_notifications` row is created and the fetch to `send-staff-notification` returns 200 (regression fix).
- Confirm `send-campaign` still successfully invokes `send-email-guarded` (unchanged, service path).
- Confirm `send-email-guarded` called with `priority: "critical"` from a non-service context is downgraded to `normal` (already in code — just prove it).
- Dashboard: send an SMS from `SMSChat.tsx` as a logged-in company_admin → still works for own company; forging Company B's `companyId` → `403`.

## Deploy

After edits, deploy the affected functions:
`booking-actions`, `verify-insurance` (only if we make the optional edit).
