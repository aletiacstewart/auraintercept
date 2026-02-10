

# Fix: Use Jessica (ElevenLabs) Voice Everywhere -- Eliminate Polly

## The Problem

Every hold message, error message, and fallback currently uses `<Say voice="Polly.Joanna">`, which is a completely different voice from Jessica. This creates a jarring, robotic experience and breaks the illusion that the caller is speaking with one person.

## The Solution: Pre-Generate Jessica Hold Audio at Call Start

The reason Polly is used for hold messages is speed -- generating ElevenLabs audio mid-call adds seconds of latency. The fix is to **pre-generate a set of common hold/filler phrases in Jessica's voice when the call first connects**, then store those URLs and use `<Play>` throughout the call instead of `<Say voice="Polly.Joanna">`.

When a call comes in, we already generate the greeting via ElevenLabs. We'll generate 3 additional short phrases at the same time (in parallel), and store the audio URLs in the call log metadata. Then every hold message, retry, and fallback uses those pre-cached Jessica audio files.

## Technical Changes

### File: `supabase/functions/voice-handler/index.ts`

**1. Pre-generate hold phrases during `handleIncoming` (around line 233)**

After the greeting TTS is generated, fire off parallel TTS requests for 3 short hold phrases:

- "Sure, let me look into that for you."
- "One moment, I'm just checking on that."
- "Almost ready, just one more second."

These are generated in parallel alongside the greeting so they don't add latency to call pickup. The resulting audio URLs are stored in the `call_logs.metadata` as `hold_audio_urls`.

**2. Update timeout branch (line 570-574)**

Replace:
```
<Say voice="Polly.Joanna">One moment please, let me check on that for you.</Say>
<Pause length="4"/>
```

With:
```
<Play>{holdAudioUrls[0]}</Play>
```

Uses the first pre-generated Jessica audio clip. No pause needed since the audio itself fills the silence.

**3. Update pickup retry (line 724-726)**

Replace:
```
<Pause length="3"/>
```

With:
```
<Play>{holdAudioUrls[retryIndex]}</Play>
```

Uses a different pre-generated phrase for each retry so it doesn't repeat.

**4. Update `buildPlayThenGather` fallback (line 46-47)**

When no `audioUrl` is available for the main response, fall back to any available hold audio URL from metadata before resorting to Polly. Polly becomes the absolute last resort (error states only like "this number is not configured").

**5. Keep Polly only for true error/edge cases**

Polly will remain for situations where we have no ElevenLabs credentials at all (unconfigured numbers, system errors, hangup messages). These are rare edge cases where voice consistency doesn't matter since the call is ending anyway.

## How It Works

```text
Call comes in
  |
  +--> Generate greeting TTS (Jessica)
  +--> Generate hold phrase 1 TTS (Jessica)  } All 3 run
  +--> Generate hold phrase 2 TTS (Jessica)  } in parallel
  +--> Generate hold phrase 3 TTS (Jessica)  }
  |
  +--> Save all URLs to call_logs.metadata.hold_audio_urls
  |
  +--> Return greeting TwiML
  
...later, AI takes too long...
  |
  +--> Read hold_audio_urls from call_logs metadata
  +--> Return <Play>{hold_audio_urls[0]}</Play> instead of <Say>
  
...pickup retry needed...
  |
  +--> Return <Play>{hold_audio_urls[1]}</Play> (different phrase)
```

## Expected Results

| Scenario | Before | After |
|----------|--------|-------|
| Hold message | Polly robot voice | Jessica's voice |
| Retry wait | Dead silence | Jessica saying a different phrase |
| Voice consistency | Switches between 2 voices | Jessica throughout |
| Hold message variety | Same phrase every time | 3 rotating phrases |
| Call start latency | ~2s (1 TTS call) | ~2s (4 TTS calls in parallel) |

## No Database Schema Changes

The `hold_audio_urls` array is stored in the existing `metadata` JSONB column on `call_logs` -- no migration needed.

