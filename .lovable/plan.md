

## Build Web Speech API Fallback + TTS Utility

### Overview

Two additions that reduce ElevenLabs costs and provide voice capabilities to all tiers:

1. **Web Speech API fallback for VoiceChat** -- when no ElevenLabs agent is configured, use the browser's free built-in speech synthesis + recognition instead of showing "not configured"
2. **Standalone TTS utility** -- a reusable `speak()` function for reading notifications, confirmations, and other UI text aloud using the browser voice (zero cost)

### Cost Impact

- Starter/free tier users get a basic voice chat experience at zero cost
- The standalone TTS utility uses no ElevenLabs credits at all
- ElevenLabs is still used for paid tiers that have it configured (no change there)
- Phone calls via SignalWire are completely unaffected

---

### Technical Details

#### 1. New file: `src/lib/browserTts.ts`

A shared utility that centralizes all Web Speech API logic:

- `speak(text, options?)` -- speaks text aloud, returns a Promise that resolves when done
- `stopSpeaking()` -- cancels current speech
- `isSpeechSupported()` -- checks browser support
- `getVoices()` -- lists available browser voices
- Options: `rate`, `pitch`, `volume`, `lang`, `voiceName`
- Picks a natural-sounding female English voice by default (matching "Aura" branding)

This replaces the duplicated `speakWithBrowser` functions in `AIAgentSettings.tsx` and `TTSProviderSettings.tsx`.

#### 2. Updated: `src/components/ai/VoiceChat.tsx`

When `agentId` is null (no ElevenLabs configured), instead of showing "Voice agent not configured":

- Use the browser's `SpeechRecognition` API for listening
- Use `speak()` from the new utility for responses  
- Route user speech through the existing `ai-agent-chat` edge function (same text-mode multi-agent pipeline already in place)
- Show a "Browser Voice" badge so users know it's the free tier experience
- The orb, status text, and start/stop buttons work the same way

This means the conversational AI logic (booking tools, triage, etc.) still works -- only the voice layer changes.

#### 3. Updated: `src/components/ai/AIAgentSettings.tsx` and `TTSProviderSettings.tsx`

- Replace inline `speakWithBrowser` with import from `src/lib/browserTts.ts`
- No behavior change, just deduplication

#### 4. New hook: `src/hooks/useBrowserVoiceChat.ts`

Encapsulates the browser-based voice chat logic (SpeechRecognition + speechSynthesis + ai-agent-chat calls) so VoiceChat.tsx stays clean. Returns the same interface shape (`status`, `isSpeaking`, `startSession`, `endSession`) for easy switching.

### File Summary

| File | Action |
|------|--------|
| `src/lib/browserTts.ts` | Create -- shared TTS utility |
| `src/hooks/useBrowserVoiceChat.ts` | Create -- browser voice chat hook |
| `src/components/ai/VoiceChat.tsx` | Update -- add browser fallback path |
| `src/components/ai/AIAgentSettings.tsx` | Update -- use shared utility |
| `src/components/ai/TTSProviderSettings.tsx` | Update -- use shared utility |

### Browser Compatibility Note

- `speechSynthesis` (TTS): Supported in all modern browsers
- `SpeechRecognition`: Supported in Chrome, Edge, Safari 17+. Firefox has limited support. A "not supported" message will show for unsupported browsers.

