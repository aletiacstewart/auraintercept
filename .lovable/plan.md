## What's actually happening

Every recent send to `+13618139836` from `+14847372424` is being rejected by SignalWire with:

```
HTTP 422 · code 10000 · "To must send to a verified caller id"
```

The Aura code is fine — the request reaches SignalWire's LaML Messages endpoint, SignalWire authenticates the project, and then SignalWire itself refuses the recipient. That means the failure is happening **inside the SignalWire Space**, not in Aura's edge functions.

On a paid Space, code 10000 means one of these — not "trial restrictions":

1. The API credentials saved in Aura belong to a **different Space or subproject** than the upgraded one (very common when a Space was upgraded but Aura still has the old project ID + token).
2. The **From number `+14847372424` is not owned by the Space** those credentials authenticate into, so SignalWire treats the From as unverified.
3. The Space is paid but the **US long-code number is not attached to an approved A2P 10DLC Campaign**. Unregistered US long codes on SignalWire can only send to numbers verified in the Space — exactly the 10000 behavior.
4. The number is voice-only (SMS capability not enabled on that DID).

## Plan

### 1. Add a "SignalWire health check" diagnostic (read-only)

Extend the existing `sms-diagnostic` edge function with an optional `mode: "health"` that, given a `companyId`, calls SignalWire directly and returns:

- `GET /api/laml/2010-04-01/Accounts/{project}.json` → confirms credentials work and shows the **account type** (`Trial` vs `Full`) and **friendly name** — this is the definitive answer to "are we actually on the paid Space?"
- `GET /api/laml/2010-04-01/Accounts/{project}/IncomingPhoneNumbers.json` → lists every number owned by the authenticated project, with `capabilities.sms` and `sms_url`. We confirm `+14847372424` is in that list and SMS-enabled.
- `GET /api/relay/rest/phone_numbers?filter_number=14847372424` (best-effort) → returns the 10DLC campaign association if any.

The response is shown in the SMS Logs page in a new "SignalWire Health" panel so you can see, in plain English: account type, From number ownership, SMS capability, 10DLC campaign linkage.

This single screen tells us which of the four causes above is the real one.

### 2. Make the 10000 error message honest

Right now the error text in `sms-guard.ts` says "upgrade from trial". On a paid Space that's misleading. Update the 10000 branch to read:

> SignalWire rejected this recipient (code 10000). On a paid Space this usually means: (a) the From number is not owned by the project these API credentials authenticate into, or (b) the number is not attached to an approved A2P 10DLC campaign and can therefore only message numbers verified in the Space. Run "SignalWire Health" from SMS Logs to see which.

### 3. Add a one-click "Send to verified test number" path

In the existing "Send test SMS" dialog on `/dashboard/sms-logs`, add a second button: **Send to a Space-verified number**. It calls `sms-diagnostic` with a flag that bypasses the Aura allowlist (still requires `company_admin`) so you can prove end-to-end delivery using a number you've added under SignalWire → Phone Numbers → Verified Caller IDs. If that send succeeds, the platform is healthy and the remaining work is purely 10DLC / number ownership inside SignalWire.

### 4. Settings surface for SignalWire credentials

Under **Settings → Integrations → SMS**, surface the current `signalwire_space_url`, `signalwire_project_id` (masked), and `signalwire_phone_number`, with a "Re-test credentials" button that runs the health check from step 1. Today these values are only editable; there's no read-back, which is why a mismatched Space is hard to spot.

### 5. No schema changes

`sms_logs` already stores `provider`, `provider_code`, `provider_status`, `provider_message_id`, and `metadata`. The UI updates from the last round already surface those. Nothing new in the database.

## Technical notes

- Files touched: `supabase/functions/sms-diagnostic/index.ts` (add `health` mode), `supabase/functions/_shared/sms-guard.ts` (rewrite the 10000 error string), `src/pages/SMSLogs.tsx` (Health panel + verified-number test button), `src/components/integrations/SMSIntegrationSettings.tsx` or equivalent (read-back + Re-test button).
- All SignalWire calls stay server-side; the project token is never sent to the browser.
- No changes to `send-campaign`, `send-appointment-sms`, `missed-call-handler`, or `sms-handler` — those are already correct; the failure is downstream of them.

## What you'll need to do on SignalWire's side (cannot be fixed from Aura)

Whichever of these the health check identifies:

- If account type is still `Trial` → upgrade that specific Space (the upgrade may have happened on a different Space).
- If `+14847372424` is not listed under IncomingPhoneNumbers for this project → either move the number to this project or update Aura's credentials to the project that owns it.
- If the number has no 10DLC campaign → register a Brand + Campaign in SignalWire and attach `+14847372424` to it. Until that's approved, US long-code SMS to non-verified numbers will keep returning 10000 regardless of plan.
- If SMS capability is off on the DID → enable it in the number's settings.
