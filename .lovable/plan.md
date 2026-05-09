# Fix: Voice toggle stuck after "Microphone unavailable"

## Problem
When the browser blocks the mic (permission denied, no device, or another tab holding it), the Voice toggle keeps pulsing and clicking it does not disable voice mode. Two root causes:

1. `useVoiceInput.start()` shows the error but `isVoiceModeEnabled` stays `true` in `VoiceContext`, so the `useEffect([isVoiceModeEnabled])` keeps trying to start again on every re-render that re-creates `start`.
2. `useVoiceInput`'s `onend` auto-restart fires a 100ms `setTimeout` that can re-call `recognition.start()` even after the user toggled off, because the timeout is queued before `stop()` clears the ref.

The button itself looks "blinking" because the ping ring keys off `isListening`, which flickers true→false→true as the recognition loop retries.

## Fix

### 1. `src/contexts/VoiceContext.tsx`
- In `handleError`, when the message matches mic-unavailable / not-allowed / no-microphone, auto-disable voice mode:
  - `setIsVoiceModeEnabled(false)` and write `'false'` to `localStorage` immediately so it does not re-enable on reload.
  - Show a single sticky toast: "Microphone unavailable — voice mode turned off. Enable mic permissions and try again."
- Guard the start/stop effect so it does not re-run `start()` while an `error` is present.

### 2. `src/hooks/useVoiceInput.ts`
- `stop()` should:
  - clear `restartTimeoutRef` first,
  - null out `recognitionRef.current` BEFORE calling `.abort()` (use `abort`, not `stop`, to drop pending results),
  - reset `error` to `null` so the next user-initiated start is clean.
- `onend` auto-restart guard: also skip restart if `state.error` is set or if `recognitionRef.current` was nulled.
- `start()`: if `getUserMedia` throws `NotAllowedError` / `NotFoundError` / `NotReadableError`, return distinct error messages and do not create a recognition instance.
- Ensure `getUserMedia` runs synchronously inside the user-gesture click (already is via toggle handler — keep as-is, just add the permission probe with `navigator.permissions.query({ name: 'microphone' })` when available, to fail fast without prompting again).

### 3. `src/components/voice/VoiceModeToggle.tsx`
- When `error` from `useVoice()` is set, render the icon in a muted/destructive state and stop the ping animation, so the button visually reflects "off / blocked" instead of pulsing.
- Tooltip shows the error reason when present.

## Out of scope
- No changes to `voice-navigator` edge function or AI flow.
- No changes to ElevenLabs / browser-TTS fallback (separate cost-savings track).

## Verification
- Toggle voice on with mic blocked in browser → expect single toast, toggle visibly turns off, no pulsing.
- Toggle voice on with mic granted → works as before.
- Toggle off mid-session → recognition stops within 200ms, no auto-restart.
