## What the logs actually show

Your latest campaign send (`e588f682-…`, 22:26:21 UTC) **did reach SignalWire**:

- `send-appointment-sms` edge log: `SignalWire SMS error: {"code":"10000","message":"To must send to a verified caller id","status":400}` → `SMS send status: 422`
- `sms_logs` row: `status=failed`, `error=SignalWire 10000: To must send to a verified caller id …`
- `send-campaign` HTTP response: `{ "sent": 0, "failed": 1, "firstSmsError": "SignalWire 10000…" }`

A 10000 response only comes back **after** SignalWire receives the API POST and rejects it because the recipient isn't on the verified list for that Space (trial-mode restriction). It is not a guard block, not a credential failure, and not a network drop. The earlier `+11261813983` failure you saw in the SignalWire dashboard was a *different* attempt (from when the wrong number was passed in) — it does not appear in the most recent send.

So there are really two things to do:

1. Make it obvious in-app that the message reached SignalWire and was rejected by SignalWire (right now SMS Logs only shows the error text, not the provider trace).
2. Give you a one-click way to prove reachability without running a campaign.

## Plan

### 1. Surface SignalWire provider trace in SMS Logs
File: `src/pages/SMSLogs.tsx`
- For each failed/sent row, render a small "Provider" line that reads from `metadata`:
  - `provider: signalwire`
  - `provider_code` (e.g. `10000`)
  - `provider_status` (HTTP status from SignalWire, e.g. `400`)
  - `provider_message_id` (when sent)
- Add a "Reached SignalWire" pill (green) whenever `metadata.provider_status` exists, so it's visually clear the request hit SignalWire even on failures.
- Add a "SignalWire ref" copy button next to failed rows that opens the SignalWire error-code docs (`more_info` URL pattern).

No backend changes needed — `sms-guard.ts` already writes `provider`, `provider_code`, `provider_status` into `metadata` on failure and `provider_message_id` on success.

### 2. Add a "Send Test SMS" diagnostic
Files:
- `supabase/functions/sms-diagnostic/index.ts` (new) — accepts `{ companyId, to }`, runs `sendGuardedSms(..., source: 'campaign')` with a fixed body `"Aura Intercept test — please ignore."`, and returns the full `GuardedSmsResult` plus the SignalWire HTTP status.
- `src/pages/SMSLogs.tsx` — small "Send test SMS" dialog (To number + Send). On success, toast with the SignalWire message SID; on failure, show `provider_code` + friendly message and a link to verify the number in SignalWire.

This lets you confirm that any number you've added to Leads/Customers *does* reach SignalWire, independent of campaigns. If a test send returns 10000, the proof is unambiguous: Aura is calling SignalWire correctly and SignalWire is rejecting because the recipient isn't on the Space's verified list (or the Space is still on trial).

### 3. One small backend tweak (optional)
File: `supabase/functions/send-appointment-sms/index.ts`
- Prepend log lines with `[send-appointment-sms]` so they're easy to attribute in the function-logs viewer (currently they look identical to `sms-handler` logs and that's what caused the "isn't it the wrong path?" doubt).

### Out of scope (intentionally)
- Bypassing SignalWire 10000. That requires either verifying `+13618139836` in your SignalWire Space or upgrading the Space out of trial — neither can be done from Aura.
- Changing the guard. The guard already allowed this recipient through; the rejection is downstream at SignalWire.

## After this ships
- Send the campaign again.
- In SMS Logs you'll see: green "Reached SignalWire" pill + red "Failed" badge + `provider_code: 10000` + `provider_status: 400` on the same row.
- If you click "Send test SMS" to the same number you'll get the same 10000 — that's the definitive proof the call is reaching SignalWire and the fix is on the SignalWire Space side.