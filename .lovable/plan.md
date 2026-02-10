

# Fix: Restore TTS Audio Upload (Affects All Companies)

## Current Problem

The last optimization changed the TTS output to `ulaw_8000` format with `audio/basic` content type. Supabase Storage rejects `audio/basic`, so **every TTS upload fails for every company**. The system falls back to a flat Polly "Hello" greeting and cannot generate conversational responses.

## Multi-Tenancy Status: Already Working

No multi-tenancy changes are needed. The voice system already resolves the correct company by matching the incoming phone number against `tenant_integrations.signalwire_phone_number`. Each company's ElevenLabs API key, voice ID, greeting, and AI prompt are loaded per-call from the database. When you onboard a new company, they just need their row in `tenant_integrations` populated.

## The Fix

**File:** `supabase/functions/voice-handler/index.ts` (lines 524-563)

Three changes inside the `generateTTSAudio` function:

1. **Output format**: Change `ulaw_8000` to `mp3_22050_32` (low-bitrate MP3 — 4x smaller than the original 44kHz/128kbps, supported by both Supabase Storage and SignalWire)
2. **File extension**: Change `.wav` back to `.mp3`
3. **Content type**: Change `audio/basic` back to `audio/mpeg`

All other optimizations stay in place:
- `eleven_flash_v2_5` model (fastest TTS)
- `google/gemini-2.5-flash-lite` (fastest AI for phone)
- Parallel DB save + TTS generation

## Expected Result

- TTS uploads succeed again for all companies
- Audio files are still ~4x smaller than the original format (faster upload/download)
- Response latency stays at ~3-4 seconds (down from the original ~10 seconds)
- Every onboarded company benefits from these speed improvements automatically since the code path is shared

