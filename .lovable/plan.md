

## Fix: Outbound Calls Not Being Placed (SignalWire Silent Failure)

### Problem
SignalWire accepts the API request (HTTP 200) but never actually places the call. The phone never rings, no call SID is returned, and the voice-handler receives no webhook callbacks. This is a silent failure.

### Root Cause
The `Url` webhook parameter passed to SignalWire contains the **entire call message** JSON-encoded and URL-encoded in the query string. For appointment reminders, this can produce URLs over 1000+ characters. SignalWire silently rejects calls with excessively long or problematic webhook URLs, returning 200 with an empty body instead of an error.

### Solution: Store Context in Database Instead of URL

Instead of cramming the call context into the webhook URL, store it in the `call_logs` table first and pass only a short reference ID.

**Step 1: Update `outbound-call/index.ts`**
- Insert the call log record BEFORE calling SignalWire (currently done after)
- Use the inserted record's ID as the context reference
- Shorten the `Url` parameter to: `voice-handler?action=outbound&callLogId={id}`
- Update the call log with the SID after SignalWire responds
- Log all SignalWire response headers for diagnostics

**Step 2: Update `voice-handler/index.ts`**
- Modify the `outbound` action handler to look up context from `call_logs` using `callLogId`
- Fall back to URL-encoded context for backward compatibility

### Flow After Fix

```text
outbound-call function:
  1. Insert call_logs row with context (purpose, message, etc.)
  2. Call SignalWire with short URL: voice-handler?action=outbound&callLogId=<uuid>
  3. Update call_logs row with SID from response

voice-handler (outbound action):
  1. Read callLogId from query params
  2. Fetch context from call_logs table
  3. Generate TwiML response with the stored message
```

### Files to Change
- `supabase/functions/outbound-call/index.ts` -- Move call log insert before SignalWire call, shorten webhook URL, add header logging
- `supabase/functions/voice-handler/index.ts` -- Update outbound handler to fetch context from database

### Additional Diagnostics
- Log all SignalWire response headers (Content-Type, X-Request-Id, Location, etc.) to help debug any future silent failures
- If SignalWire still returns empty body after this fix, the headers will reveal whether it's a redirect, rate limit, or other issue

