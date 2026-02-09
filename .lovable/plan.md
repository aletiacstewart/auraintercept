

## Fix: No Audio on Outbound Calls

### Root Cause

The timeline from logs shows the problem clearly:

```text
T+0s   Call answered, SignalWire sends webhook to voice-handler
T+2s   TTS audio generated and uploaded to storage
T+2s   TwiML response finally returned to SignalWire: <Gather timeout="5"><Play>URL</Play></Gather>
T+2s+  SignalWire fetches the MP3 from storage URL
T+7s   Gather timeout expires (5 seconds after TwiML was received)
T+7s   Falls through to: "We didn't hear a response. Goodbye." -> Hangup
```

The 2-second delay generating TTS audio means SignalWire doesn't receive the TwiML until 2+ seconds after the call connects. Then the `<Gather timeout="5">` leaves only ~5 seconds to fetch the audio, play it, AND wait for input. For a multi-sentence message, the audio itself may be 5-10 seconds long, so the Gather times out before it even finishes playing.

### Solution: Pre-generate TTS Before Initiating the Call

Move TTS generation into `outbound-call` (before the SignalWire API call). Store the audio URL in `call_logs.metadata`. Then `voice-handler` just reads the URL and returns TwiML instantly -- no delay.

### Changes

**File 1: `supabase/functions/outbound-call/index.ts`**
- After building the call message and before calling SignalWire, generate TTS audio and upload to storage
- Store the `audio_url` in `call_logs.metadata` alongside `call_message`
- If TTS fails, proceed anyway (voice-handler will use Polly fallback)

**File 2: `supabase/functions/voice-handler/index.ts`**
- In `handleOutbound`, check `callLog.metadata.audio_url` first
- If a pre-generated URL exists, use `<Play>` immediately (no TTS call needed)
- If no pre-generated URL, fall back to Polly `<Say>` directly (skip TTS entirely to avoid the delay)
- Increase `<Gather>` timeout from 5 to 15 seconds to allow longer messages to finish playing
- Add `bargeIn="true"` so users can interrupt with a keypress without waiting

**File 3: `supabase/functions/test-voice-reminder/index.ts`**
- Same pattern: pre-generate TTS audio before calling SignalWire
- Store audio URL in call log metadata

### Technical Details

The key architectural change is shifting TTS generation from the webhook response path (where it blocks SignalWire) to the call initiation path (where latency doesn't matter):

```text
BEFORE (broken):
  outbound-call: insert log -> call SignalWire
  voice-handler: fetch log -> generate TTS (2s delay) -> return TwiML

AFTER (fixed):
  outbound-call: insert log -> generate TTS -> store URL in log -> call SignalWire
  voice-handler: fetch log -> read audio_url -> return TwiML instantly
```

### Files Modified
- `supabase/functions/outbound-call/index.ts` -- add TTS pre-generation before SignalWire call
- `supabase/functions/voice-handler/index.ts` -- use pre-generated audio URL, remove TTS call, increase Gather timeout
- `supabase/functions/test-voice-reminder/index.ts` -- same TTS pre-generation pattern

