## Problem

Outbound SMS is reaching numbers that aren't in your Leads/Customers lists. Looking at the logs:

- The campaign function (`send-campaign`) is actually sending to `+13618139836`, which **does** match Aletia Stewart in `customer_profiles` and `leads` — that part is correct.
- However, the failed SignalWire message you saw (`To +11261813983`) does **not** appear anywhere in `customer_profiles`, `leads`, or `customers`. Most likely it came from one of these unguarded paths:
  - **`missed-call-handler`** — blindly sends an auto-reply SMS to whatever number called the SignalWire line, with no check against Leads/Customers.
  - **`send-staff-notification`** — sends SMS to staff records.
  - **`send-appointment-sms`** — uses the phone passed in by the caller without verifying it belongs to a known contact.

There's no central guard ensuring outbound SMS only goes to numbers that exist in `customer_profiles` or `leads` for that company. We need to add one.

## Plan

### 1. Add a shared "outbound SMS guard" helper

Create `supabase/functions/_shared/sms-guard.ts` exporting:

- `isAllowedRecipient(supabase, companyId, e164Phone, opts)` — returns `true` only if the normalized number matches:
  - `customer_profiles.phone` for `companyId`, OR
  - `leads.phone` for `companyId`, OR
  - `customers.phone` / `customers.mobile_phone` for `companyId`, OR
  - (opt-in) `staff_members.phone` for `companyId` when `opts.allowStaff = true`, OR
  - (opt-in) the inbound caller number when `opts.allowInboundCaller = true` AND a matching `call_logs` row exists in the last 24h.
- `sendGuardedSms({ supabase, companyId, from, to, body, source, allowStaff?, allowInboundCaller? })` — normalizes, checks allowlist, sends via SignalWire, and writes a row to `sms_logs` with `source` (`campaign | reminder | missed_call | staff | aura`) and `status` (`sent | failed | blocked`). Returns a structured result.
- All E.164 normalization + strict US area-code validation in one place (rejects bogus area codes like `126`).

### 2. Route every SMS sender through the guard

- **`send-campaign`** — replace the inline SignalWire/`send-appointment-sms` invoke with `sendGuardedSms(..., source: 'campaign')`. Recipients already come from `customer_profiles` + `leads`, so this is mostly belt-and-suspenders; the guard will also reject any malformed numbers that previously slipped through.
- **`send-appointment-sms`** — wrap its outbound call in `sendGuardedSms(..., source: 'reminder')`.
- **`missed-call-handler`** — switch to `sendGuardedSms(..., source: 'missed_call', allowInboundCaller: true)`. This is the change that stops random caller numbers from receiving texts unless they're already a known Lead/Customer (the inbound-caller exception is opt-in per company setting — see step 4).
- **`send-staff-notification`** — switch to `sendGuardedSms(..., source: 'staff', allowStaff: true)`.

Any path that fails the allowlist writes an `sms_logs` row with `status = 'blocked'` and `error = 'recipient_not_in_contacts'` and returns a clear error, so you can see the block in the SMS Logs UI instead of silently failing.

### 3. Surface "blocked" sends in the UI

Update `src/pages/SMSLogs.tsx` to:

- Add a `blocked` status badge (amber) alongside `sent` / `failed` / `skipped`.
- Add a filter chip for `Source` (campaign, reminder, missed call, staff).
- Show the recipient's matched Lead/Customer name when available; otherwise show `Unknown contact — blocked`.

### 4. New per-company setting for missed-call replies

Add a single `missed_call_reply_known_only` boolean on `companies` (default `true`). When `true`, `missed-call-handler` only auto-replies if the caller is already a Lead/Customer. When `false`, it replies to any caller (legacy behavior). Surface this toggle in the existing Missed Call Settings card next to the SMS template.

### 5. Backfill / data hygiene

- Migration to add `source` and `error` columns to `sms_logs` if not present, plus an index on `(company_id, created_at desc)`.
- Migration adds `missed_call_reply_known_only` to `companies`.
- No backfill of historical `sms_logs` rows (they'll just show `source = NULL`).

## Files touched

- New: `supabase/functions/_shared/sms-guard.ts`
- Edited: `supabase/functions/send-campaign/index.ts`, `supabase/functions/send-appointment-sms/index.ts`, `supabase/functions/missed-call-handler/index.ts`, `supabase/functions/send-staff-notification/index.ts`
- Edited: `src/pages/SMSLogs.tsx`, missed-call settings component
- New migration: add `sms_logs.source`, `sms_logs.error`, `companies.missed_call_reply_known_only`

## What this does NOT change

- SignalWire trial-mode error 10000 (`To must send to a verified caller id`) is still a SignalWire-account issue — you must verify recipients in SignalWire or upgrade the Space. The guard prevents wrong recipients; it doesn't bypass SignalWire's own restrictions.
