

## Fix: No Audio on Outbound Calls (TwiML Attribute Error)

### Root Cause

The `voice-handler` returns this TwiML when the call connects:

```xml
<Gather input="dtmf speech" numDigits="1" timeout="15" bargeIn="true" action="...">
  <Play>https://...mp3</Play>
</Gather>
<Say voice="Polly.Joanna">We didn't hear a response. Goodbye.</Say>
<Hangup/>
```

Two problems:

1. **`bargeIn="true"` is not a valid cXML attribute** on `<Gather>`. SignalWire/Twilio `<Gather>` does not accept this attribute. Nested `<Play>` and `<Say>` are interruptible by default inside `<Gather>` -- no attribute needed. The invalid attribute causes SignalWire to skip the `<Gather>` entirely, falling straight to the goodbye `<Say>` and `<Hangup/>`.

2. **`input="dtmf speech"` combined with `numDigits="1"`** on a phone call can cause false triggers from ambient noise being interpreted as speech input, ending the Gather prematurely. For a press-1-or-2 scenario, DTMF-only input is more reliable.

### Evidence from Logs

- Audio files are valid: 44KB, correct mimetype, public bucket
- Call answers at T+0, voice-handler fires instantly (no delay -- pre-generation working)
- Call ends at T+6 (only 6 seconds of connected time)
- No `outbound-response` action logged -- meaning SignalWire never POSTed to the Gather action URL, confirming the `<Gather>` was skipped entirely

### Fix

**File: `supabase/functions/voice-handler/index.ts`**

In `handleOutbound`, fix both the pre-generated audio path and the Polly fallback path:

- Remove `bargeIn="true"` (invalid attribute)
- Change `input="dtmf speech"` to `input="dtmf"` (more reliable for phone keypress scenarios)
- Remove `numDigits="1"` (let it use the default behavior with timeout)

Before:
```xml
<Gather input="dtmf speech" numDigits="1" timeout="15" bargeIn="true" action="...">
  <Play>URL</Play>
</Gather>
```

After:
```xml
<Gather input="dtmf" numDigits="1" timeout="15" action="..." method="POST">
  <Play>URL</Play>
</Gather>
```

Same change applies to the Polly `<Say>` fallback path below it.

### Files Modified
- `supabase/functions/voice-handler/index.ts` -- remove invalid `bargeIn` attribute, switch to DTMF-only input

