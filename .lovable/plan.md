

# Fix: Call Hangs Up After Greeting Instead of Listening

## Root Cause

The call flow is:
1. `handleIncoming()` generates TTS audio, uploads it to storage, returns TwiML with `<Gather><Play>...</Play></Gather>`
2. SignalWire plays the audio... then the call ends

The logs confirm only `action=incoming` fires -- no `action=process` ever triggers, meaning SignalWire never sends speech results back.

The problem is the combination of `<Play>` (pre-recorded audio URL) inside `<Gather input="speech">`. SignalWire has known compatibility issues with speech recognition inside `<Gather>` when using `<Play>` instead of `<Say>`. When the `<Play>` finishes and no speech is detected within the first moments, SignalWire falls through to the `<Redirect>` which calls the timeout handler, which says "I didn't hear anything" and hangs up.

## The Fix

**Switch from `<Play>` inside `<Gather>` to a two-step approach:**

1. First, play the greeting audio **outside** the `<Gather>` element
2. Then open a `<Gather input="speech">` with a short `<Say>` prompt (or empty) to listen for the caller's response

This ensures the high-quality ElevenLabs audio plays fully, and then SignalWire properly enters speech-listening mode.

Apply the same pattern to all three `<Gather>` locations:
- `handleIncoming()` -- initial greeting (line 203)
- `handleProcess()` -- nudge when no speech (line 365)
- `handleProcess()` -- AI response (line 433)

## Technical Details

**File:** `supabase/functions/voice-handler/index.ts`

### Change 1: `handleIncoming()` (lines 203-208)

**Before:**
```xml
<Gather input="speech" timeout="12" speechTimeout="5" action="...">
  <Play>https://...greeting.mp3</Play>
</Gather>
<Redirect>...timeout...</Redirect>
```

**After:**
```xml
<Play>https://...greeting.mp3</Play>
<Gather input="speech" timeout="12" speechTimeout="5" action="..." method="POST">
  <Say voice="Polly.Joanna"> </Say>
</Gather>
<Redirect method="POST">...timeout...</Redirect>
```

The `<Say>` with a space character is a minimal prompt that keeps the `<Gather>` valid (some SignalWire versions require content inside `<Gather>`). The greeting audio plays first, then the system enters listening mode.

### Change 2: Update `ttsOrFallback()` (lines 24-35)

Split the return into two pieces -- a "play" element and a "gather-safe" element -- or change the approach so the function returns just the audio URL and each call site handles placement. The simplest approach: have `ttsOrFallback()` return the raw audio URL (or `null` on failure), and let each call site place `<Play>` outside `<Gather>`.

### Change 3: `handleProcess()` nudge (line 365) and AI response (line 433)

Apply the same pattern: `<Play>` before `<Gather>`, not inside it.

### Additional: Add `method="POST"` to all `<Gather>` tags

Per the SignalWire compatibility standard in the memory notes, all `<Gather>` tags should have explicit `method="POST"`. The current code at line 204 is missing it.

## Summary of Changes

- **1 file modified:** `supabase/functions/voice-handler/index.ts`
- **3 `<Gather>` blocks updated** to play audio before the gather, not inside it
- **`ttsOrFallback()` refactored** to return audio URL separately so call sites can place `<Play>` outside `<Gather>`
- **`method="POST"` added** to all `<Gather>` elements for SignalWire compatibility
- No database changes

