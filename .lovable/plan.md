## Root cause

The `1 sent` toast is misleading — the actual `campaign_sends` rows show:

- **Email** rejected by Resend: `The \n is not allowed in the subject field` (campaign subject contains a newline)
- **Email** rejected: malformed `to` like `"a r a s at alicia steward dot com"` (voice-transcription artifact in `customer_profiles`)
- Placeholder addresses (`@noemail.placeholder`, `@phone.placeholder`) are being treated as real recipients
- **SMS** rejected by SignalWire: `"To must send to a verified caller id"` (trial-account restriction)
- The one "sent" SMS went to a malformed number (`+1-261-813-983`, 10 digits not 11) that SignalWire happened to accept — not a real delivery

## Changes

### 1. `supabase/functions/send-campaign/index.ts` — input sanitization

- **Subject sanitizer**: `subject.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200)` before passing to `send-email-guarded`.
- **Email validator**: skip recipient when
  - email ends in `@noemail.placeholder` or `@phone.placeholder`, OR
  - email does not match `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
  
  Push row with `status: 'skipped'`, `error: 'invalid_email'`. Do NOT increment `failed`.
- **Phone normalizer**: strip non-digits; if 10 digits prepend `+1`; if 11 digits starting with `1` prepend `+`; otherwise skip with `status: 'skipped'`, `error: 'invalid_phone'`.
- **Accounting**: add `skipped` counter; return `{ sent, failed, skipped, recipientCount }`. Treat `sent === 0 && failed === 0 && skipped > 0` as a 400 with message `"No valid recipients — all customer phones/emails were missing or invalid."`
- Redeploy.

### 2. Toast copy — `MarketingSalesAgentConsole.tsx` and `Campaigns.tsx`

After invoke, read `data.sent / failed / skipped` and show:
- `sent > 0`: `"Campaign sent: {sent} delivered, {failed} failed, {skipped} skipped"`
- `sent === 0 && skipped > 0`: warning toast `"No messages sent — {skipped} recipients had invalid contact info."`
- `sent === 0 && failed > 0`: error toast already surfaces first error; if it contains `verified caller id`, replace with `"SignalWire rejected SMS — your SignalWire account must verify recipient numbers (trial-account limit) or upgrade to a paid plan."`

### Verify

Click Send Again on the same campaign:
- Confirm zero Resend `\n` errors in `email_send_log`.
- Confirm skipped rows appear in `campaign_sends` with reasons.
- Confirm toast accurately reflects outcome.

### Out of scope

- Cleaning bad rows already in `customer_profiles` (voice-transcribed garbage emails/phones).
- SignalWire account verification — that's done in your SignalWire dashboard, not code.
- Schema or UI restructuring.
