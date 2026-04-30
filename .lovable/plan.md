# Add Mic Toggle to "Message Aura" Landing Chat

## Problem
The public "Message Aura" chat widget on the landing page (and embedded Smart Website widgets) only accepts typed input. There's no way for visitors to speak their question, even though we already ship a working browser speech-recognition hook (`useVoiceInput`) used elsewhere in the platform.

## Solution
Add a microphone button inside the input row of `LandingAIChat.tsx` that toggles browser dictation on/off and streams the recognized speech into the input field. Submit stays manual (user reviews text, then taps send) — same UX pattern as the in-app `FloatingInput` component already uses.

## Changes

**File: `src/components/landing/LandingAIChat.tsx`**

1. Import `Mic` and `MicOff` from `lucide-react` and the existing `useVoiceInput` hook from `@/hooks/useVoiceInput`.
2. Wire up the hook in non-continuous mode with an `onTranscript` callback that appends final transcripts into the `input` state.
3. Add a mic toggle `Button` between the `Input` and `Send` button:
   - Default state: ghost mic icon, muted color.
   - Listening state: filled icon with the cyan glow used elsewhere (`hsl(189,100%,55%)`) and a subtle pulse so the user knows the mic is hot.
   - Disabled when terms aren't agreed or when the browser doesn't support speech recognition (`isSupported === false`) — in that case hide the button entirely so unsupported browsers (e.g. Firefox) don't see a dead control.
4. Show a small toast on permission denial (the hook already produces an error string we can surface).

## Out of scope
- No ElevenLabs realtime STT — the browser Web Speech API is free, instant, already integrated, and matches what `FloatingInput` and the technician console use.
- No auto-submit on silence. User taps send to confirm, which avoids accidental sends and matches the existing pattern.
- No changes to the authenticated in-app Aura chat — it already has voice via `FloatingInput` / `AuraVoicePanel`.

## Technical notes
- `useVoiceInput({ continuous: false, onTranscript: (t, isFinal) => isFinal && setInput(prev => (prev ? prev + ' ' : '') + t.trim()) })`
- The mic button must be `type="button"` to avoid submitting the form.
- Style the listening state with the same inline `boxShadow`/`color` pattern used in `FloatingInput.tsx` to stay on-theme with Cyber-Sentry.
