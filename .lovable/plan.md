

# Fix: Tune Speech Timing to Stop AI from Rushing

## The Problem

The greeting now plays correctly, but the AI agent is not waiting for you to respond with your name and phone number. This is caused by SignalWire's speech detection parameters being too aggressive:

- `barge_confidence: 0.7` -- too sensitive, background noise or breath triggers an interruption
- `end_of_speech_timeout: 3000` (3s) -- reasonable but could be longer for dictation
- No `barge_match_string` -- means ANY detected sound can interrupt the agent

## The Fix

In `supabase/functions/voice-handler/index.ts`, update the `params` block (lines 158-165):

| Parameter | Current | New | Why |
|-----------|---------|-----|-----|
| `barge_confidence` | 0.7 | 0.9 | Only interrupt agent when very confident caller is speaking |
| `end_of_speech_timeout` | 3000 | 4000 | Give callers 4 seconds to pause while spelling names/emails |
| `attention_timeout` | 25000 | 30000 | Wait 30s before asking "are you still there?" |
| `interruption_threshold` | (not set) | 200 | Agent must speak for at least 200ms before barge-in is allowed, preventing instant cutoff during greeting |

Updated params block:
```typescript
params: {
  static_greeting: greeting,
  swaig_allow_swml: true,
  end_of_speech_timeout: 4000,
  attention_timeout: 30000,
  inactivity_timeout: 60000,
  barge_confidence: 0.9,
  interruption_threshold: 200,
},
```

## No Other Changes

Single block update in the params object. The prompt, voice, SWAIG tools, and greeting all stay the same.
