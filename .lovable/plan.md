

# Fix: SignalWire Rejecting SWML — Phone Number Configured for cXML

## Problem

The voice-handler now returns SWML (JSON), but the SignalWire phone number is still set to **"LaML Webhooks"** which expects XML (cXML/TwiML). SignalWire can't parse JSON as XML, so it drops every call.

The logs confirm the function runs correctly ("AI direct mode: returning SWML document for company...") but SignalWire rejects the response format.

## Fix — Two Parts

### Part 1: You Change SignalWire Dashboard Setting (30 seconds)

1. Go to your SignalWire dashboard
2. Click **Phone Numbers** (or **Resources** if on the new UI)
3. Find the phone number and click **Edit Settings**
4. Change **"Handle Calls Using"** from **"LaML Webhooks"** to **"SWML Scripts"**
5. Keep the same webhook URL: `https://zwlcwtgjvesbevheknbk.supabase.co/functions/v1/voice-handler?action=incoming`
6. Save

### Part 2: I Rewrite Ring-First Mode to Use SWML Instead of TwiML

Currently, ring-first mode returns TwiML (`<Dial>` with a `<Number>`), which won't work when the phone number is in SWML mode. I need to convert this to SWML's native `connect` verb.

**Changes to `supabase/functions/voice-handler/index.ts`:**

1. **Rewrite `handleIncoming` ring-first path**: Instead of returning TwiML `<Dial>`, return a SWML document that uses the `connect` verb with a timeout, followed by an `ai` block as fallback. SWML handles this natively — if the connect times out, it falls through to the next instruction (the AI agent).

2. **Remove `handleDialStatus`**: No longer needed. In SWML, the ring-then-AI-fallback is a single document — SignalWire automatically falls through from `connect` to `ai` when the dial times out. No separate callback is required.

3. **Remove the `dial-status` case** from the router switch statement.

4. **Update error responses**: Change the catch-all error from TwiML to SWML format (a simple `play: "say:..."` with `hangup`).

**New ring-first SWML structure:**
```text
{
  "version": "1.0.0",
  "sections": {
    "main": [
      { "answer": {} },
      {
        "connect": {
          "to": "+1XXXXXXXXXX",
          "timeout": 15
        }
      },
      {
        "ai": { ... same AI agent config ... }
      }
    ]
  }
}
```

If the business owner answers within 15 seconds, the call connects. If not, SignalWire automatically moves to the `ai` block and Jessica takes over. No webhook callbacks, no race conditions.

**Outbound calls are NOT affected** — they are initiated via the Compatibility REST API which passes its own webhook URL. Those endpoints (`handleOutbound`, `handleOutboundResponse`) still return TwiML and will continue to work since the Compatibility API always expects cXML.

## Summary of Code Changes

| File | Change |
|------|--------|
| `voice-handler/index.ts` | Rewrite ring-first to use SWML `connect` verb; remove `handleDialStatus` and `dial-status` case; update error responses |

No new files or database changes needed.

