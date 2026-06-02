## Goal

Stop the "wrong email / misspelled name / no SMS" problem at three layers:
1. Fix the 4 duplicate Alicia/Aletia profiles right now.
2. Prevent it from happening again in the voice intake.
3. Make duplicates easy to merge going forward, and make the SignalWire trial limit visible.

---

## Step 0 — Confirm correct contact info (before any data change)

I need one quick answer before running the cleanup SQL:
- Real email for Alicia Stewart? (the DB currently has `aletia.stewart@gmail.com` — likely a voice transcription typo)
- Real mobile number? (DB has `+1-361-813-9836`)

I'll ask in chat after you approve this plan, then run Step 1.

---

## Step 1 — One-time cleanup of the 4 duplicate profiles

Merge into a single canonical `customer_profiles` row for Alicia Stewart:
- Name: `Alicia Stewart`
- Email: confirmed in Step 0
- Phone: confirmed in Step 0 (normalized to E.164)
- Keep the oldest `id` so any FK references (appointments, campaign_sends, etc.) remain stable
- Repoint FKs from the 3 deleted profile IDs to the kept ID across: `appointments`, `campaign_sends`, `customer_messages`, `call_logs`, `customer_notes`, `quotes`, `invoices`, `customer_interactions` (only tables that exist)
- Delete the other 3 profiles

Also run a broader sweep that flags (does not delete) any other profile where:
- email matches `@noemail.placeholder` or `@phone.placeholder`
- email contains spaces or " at " / " dot " (voice transcription tells)
- phone has fewer than 10 digits after stripping non-digits

Output: a short report of flagged rows so we can decide whether to merge or just null out their email/phone.

---

## Step 2 — Harden voice intake (prevent new garbage profiles)

In the edge functions that create `customer_profiles` from voice (`signalwire-voice-webhook`, `voice-call-completed`, `elevenlabs-tool-create-customer`, whichever path is in use):

- **Email**: Before insert, run a regex validator (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`). If it contains spaces, " at ", " dot ", or fails the regex → store `null` (not a placeholder string). Log the raw transcription in `intake_data.raw_email_transcription` so a human can recover it.
- **Phone**: Strip non-digits. Require exactly 10 digits (US) or 11 starting with `1`. Store as E.164. If invalid → store `null` and log raw value in `intake_data.raw_phone_transcription`.
- **Name**: Trim, collapse whitespace, title-case. Reject single-letter and pure-digit names.
- **Dedup on insert**: Before creating a new profile, look up by normalized phone OR normalized email within the same `company_id`. If a match exists, update that row instead of creating a duplicate.

---

## Step 3 — Duplicate detection + merge UI

New component on the existing Customers page (`src/pages/Employees.tsx` area — actual customer list page; will locate during build):

- **"Possible duplicates" banner** when 2+ profiles in the same company share any of:
  - identical normalized phone digits
  - identical lowercased email
  - similar name (Levenshtein ≤ 2 on lowercased name) AND same area code OR same email domain
- **Merge dialog**: shows the candidate rows side-by-side, lets you pick the correct value per field (name / email / phone / address), then calls a new `merge-customer-profiles` edge function that:
  - Validates inputs (same Zod rules as Step 2)
  - Repoints FKs (same table list as Step 1) in a transaction
  - Deletes losing rows
  - Logs the merge in a new `customer_merge_log` table (who, when, kept_id, merged_ids, fields chosen)

Permissions: only `company_admin` and `platform_admin`.

---

## Step 4 — Surface SignalWire trial-account block in the campaign UI

In `MarketingSalesAgentConsole.tsx` and `Campaigns.tsx`, when `send-campaign` returns the verified-caller error (already detected server-side in `send-campaign/index.ts`), show a dismissible banner above the campaign list:

> SignalWire is rejecting SMS because your account is on a trial. Verify your recipient numbers in the SignalWire dashboard, or upgrade to a paid plan, then re-send.

Include a link to `https://my.signalwire.com` and a "Don't show again for 7 days" option (localStorage).

You'll also need to verify your own mobile in SignalWire before re-testing — I can't do that for you.

---

## Out of scope

- Schema changes beyond adding `customer_merge_log`.
- Changing how appointments link to customers.
- Automatic merging without user confirmation (too risky).
- Building a full data-quality dashboard.

---

## Technical notes (for me, not required reading)

- Step 1 will be a `supabase--insert` call (data change, not schema) plus one `supabase--migration` only if `customer_merge_log` is added in Step 3.
- FK repointing uses `UPDATE table SET customer_id = :keep WHERE customer_id = ANY(:losers)` per table, inside a single SQL statement.
- Voice intake hardening lives in the edge functions only; the React side is untouched.
- The merge edge function uses `verify_jwt = false` per project standard and checks role via `has_role()` RPC.
- Duplicate detection runs client-side over the already-loaded customer list to avoid extra DB load; switch to a server-side RPC if list exceeds 500.
