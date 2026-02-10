

# Fix Phone Call Not Waiting Long Enough for Caller Input

## Root Cause

The `<Gather>` TwiML element in `voice-handler` currently uses:
```xml
<Gather input="speech" timeout="8" speechTimeout="auto" ...>
```

`speechTimeout="auto"` tells SignalWire to stop listening as soon as it detects any pause in speech. When a caller says "My name is... John Smith" with a natural pause, SignalWire cuts them off at the pause and sends only "My name is" to the handler.

## Fix

Change `speechTimeout="auto"` to `speechTimeout="5"` (wait 5 seconds of silence before finalizing) across all `<Gather>` elements in the voice-handler. Also increase `timeout` from 8 to 12 seconds to give callers more time to start speaking.

This appears in 3 places in the file:
1. **Line 199** -- `handleIncoming()` initial greeting gather
2. **Line 361** -- `handleProcess()` nudge (no speech) gather  
3. **Line 429** -- `handleProcess()` main AI response gather

## Technical Details

**File:** `supabase/functions/voice-handler/index.ts`

All three `<Gather>` elements change from:
```xml
<Gather input="speech" timeout="8" speechTimeout="auto" ...>
```
To:
```xml
<Gather input="speech" timeout="12" speechTimeout="5" ...>
```

- `timeout="12"` -- Wait up to 12 seconds for the caller to start speaking
- `speechTimeout="5"` -- After speech starts, wait 5 seconds of silence before considering the caller done

No other files change. No database changes.

