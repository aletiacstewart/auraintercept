# Plan: ElevenLabs TTS for Talk to Aura text mode

Add ElevenLabs voice playback for Aura's text-mode replies so the chat feels voiced even without burning ConvAI minutes.

## Changes

1. **New edge function `elevenlabs-tts`** (`supabase/functions/elevenlabs-tts/index.ts`, `verify_jwt = false`)
   - Body: `{ text: string, voiceId?: string }` (Zod-validated, text ≤ 4000 chars).
   - Calls `https://api.elevenlabs.io/v1/text-to-speech/{voiceId}/stream?output_format=mp3_44100_128` with `model_id: eleven_turbo_v2_5`, using `ELEVENLABS_API_KEY` from env.
   - Streams the MP3 body back with `Content-Type: audio/mpeg` + CORS.
   - Default voice = Sarah (`EXAVITQu4vr4xnSDxMaL`).

2. **`src/components/ai/VoiceChat.tsx`** — text-mode playback
   - Add a small `playAuraVoice(text)` helper that `fetch`es the edge function with `.blob()`, builds a single shared `HTMLAudioElement`, stops any in-flight playback before starting the next clip.
   - After every assistant message in `sendTextMessage` (both `assistantText` and `followUpText`), call `playAuraVoice(...)`.
   - Add a "Mute Aura's voice" 🔊/🔇 toggle next to the existing "Switch to voice mode" link; persist preference in `localStorage` (`aura.textmode.tts`). Default = on.
   - First playback gated behind the existing user-initiated "Start Text Mode" click so browsers don't block autoplay.

3. **No changes** to ConvAI voice mode, browser fallback, or `ai-agent-chat`.

## Validation
- Open `/talk-to-aura`, click "Use text mode", agree to terms, click Start Text Mode.
- Type "send me an HVAC demo, John 5125551212" → Aura's reply text appears AND plays in Sarah's voice.
- Toggle mute → next reply renders silently.
- Network tab shows `POST /functions/v1/elevenlabs-tts` returning `audio/mpeg`.

## Out of scope
- Voice mode (ConvAI) is untouched.
- No new tables, no user-pickable voice library UI (single default voice; voiceId param is there for future use).
