## Findings from the deep dive

Aura is not using one consistent SMS path today. The current setup has several Aura-side problems:

1. **Campaign SMS is mislabeled as reminders**
   - `send-campaign` calls `send-appointment-sms`.
   - `send-appointment-sms` hardcodes `source: 'reminder'`, so today’s campaign send was logged as a reminder.
   - This makes the SMS Logs page misleading and makes it harder to match SignalWire activity.

2. **Some SMS functions bypass the shared SMS sender**
   - `send-appointment-sms` and `sms-diagnostic` use the shared `sendGuardedSms` path.
   - But `appointment-reminders`, `send-review-request`, and `send-job-notification` still call SignalWire directly.
   - Those older paths do not consistently normalize numbers, do not consistently write `sms_logs`, and do not store provider codes/SIDs the same way.

3. **Aura’s error copy is wrong for a paid SignalWire Space**
   - The UI and campaign function still say “trial blocking SMS” in several places.
   - Your health check confirms the connected Space is `Full`, the number is owned, and SMS capability is enabled.
   - So Aura should stop showing trial-plan language for this account.

4. **Aura does not store enough provider trace data**
   - Today’s row has `provider_status: 422` and `provider_code: 10000`, but no SignalWire SID because SignalWire rejected the create request.
   - Aura does not store the exact endpoint, request timestamp, response body snippet, or a generated correlation ID, so matching Aura rows to SignalWire API logs is harder than it should be.

## Plan

### 1. Centralize outbound SMS through one Aura sender
Update all outbound SMS paths to use the shared `sendGuardedSms` helper:

- Campaign sends
- Appointment reminders
- Review requests
- Job notifications
- Diagnostic test sends
- Missed-call follow-up path if it is not already using the shared helper

This makes every SMS use the same:

- E.164 validation
- customer/lead/staff allowlist logic
- SignalWire endpoint
- provider response parsing
- `sms_logs` write format

### 2. Fix campaign source labeling
Pass the correct source from `send-campaign` into `send-appointment-sms`, or stop routing campaign SMS through an appointment-named function.

Expected result:

- Campaign SMS rows show `source: campaign`
- Reminder SMS rows show `source: reminder`
- No more campaign sends appearing as reminders

### 3. Add provider trace metadata to every SMS attempt
Extend the shared SMS sender to log:

- `provider: signalwire`
- `provider_endpoint: Messages.json`
- `provider_status`
- `provider_code`
- `provider_message_id` when SignalWire returns a SID
- `provider_error_message`
- `provider_response_excerpt`
- `aura_trace_id` generated before the SignalWire request
- `sent_via: shared_sms_guard`

This will let us prove whether Aura called SignalWire and compare one Aura row to SignalWire’s API logs.

### 4. Update paid-plan error handling
Replace “trial blocking SMS” language with paid-plan accurate copy:

- “SignalWire rejected the create-message request before carrier delivery.”
- “Space is paid/full; number is owned and SMS-capable.”
- “Next check: A2P 10DLC brand/campaign assignment or SignalWire-side verified-recipient restriction.”

### 5. Improve SMS Logs UI
Add a clear per-row delivery path indicator:

- **Blocked in Aura** — Aura did not call SignalWire
- **Reached SignalWire, rejected** — SignalWire returned an error response
- **Accepted by SignalWire** — SignalWire returned a SID

Also expose the trace ID and provider status/code in the row details.

### 6. Validate with a non-destructive health check and one explicit test send
After implementation:

- Run the health check again to confirm paid Space, owned number, and SMS capability.
- Send one diagnostic SMS through the shared path.
- Confirm the new SMS row contains source, endpoint, trace ID, status/code, and raw provider error excerpt.

## Files to update

- `supabase/functions/_shared/sms-guard.ts`
- `supabase/functions/send-appointment-sms/index.ts`
- `supabase/functions/send-campaign/index.ts`
- `supabase/functions/appointment-reminders/index.ts`
- `supabase/functions/send-review-request/index.ts`
- `supabase/functions/send-job-notification/index.ts`
- `supabase/functions/sms-diagnostic/index.ts`
- `src/pages/SMSLogs.tsx`
- `src/pages/Campaigns.tsx`
- `src/components/marketing/MarketingSalesAgentConsole.tsx`

## Expected outcome

Aura will have one authoritative SMS pipeline, no misleading campaign/reminder labels, no paid-plan “trial” messaging, and enough provider trace data to prove exactly what happened for each send.