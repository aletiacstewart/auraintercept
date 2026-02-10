

# Fix: Reduce Voice Response Latency from ~10s to ~3s

## Problem

Every conversation turn in `handleProcess` runs three expensive steps **one after another**:

1. AI chat call (`gemini-2.5-flash`) -- 3-5 seconds
2. ElevenLabs TTS audio generation (`eleven_turbo_v2_5`, mp3 at 44.1kHz) -- 2-3 seconds
3. Upload audio to storage -- 1-2 seconds

**Total: 6-10 seconds of silence** before the caller hears a response.

## The Fix (4 optimizations, 1 file)

All changes are in `supabase/functions/voice-handler/index.ts`.

### Optimization 1: Faster AI Model

Switch from `google/gemini-2.5-flash` to `google/gemini-2.5-flash-lite` for phone responses. Phone replies are 1-2 sentences -- they don't need the full model's reasoning power. Flash-lite is significantly faster for simple text generation.

### Optimization 2: Faster TTS Model + Telephony-Optimized Format

- Switch from `eleven_turbo_v2_5` to `eleven_flash_v2_5` (ElevenLabs' fastest model)
- Switch from `mp3_44100_128` (high-quality music format) to `ulaw_8000` (native telephony format, ~5x smaller file)
- Smaller file = faster generation + faster upload + faster download by SignalWire

### Optimization 3: Parallelize DB Save and TTS Generation

Currently the database save (conversation history update) happens **before** TTS. These two operations are independent -- run them at the same time:

```text
Before (sequential):
  save to DB --> generate TTS --> upload --> return

After (parallel):
  save to DB --|
               |--> return
  generate TTS + upload --|
```

### Optimization 4: Parallelize AI response parsing with non-dependent work

Move the conversation history push and DB save into a `Promise.all` with the TTS call so nothing waits unnecessarily.

## Technical Details

**File:** `supabase/functions/voice-handler/index.ts`

### Change A: AI model (line 403)
Change `model: 'google/gemini-2.5-flash'` to `model: 'google/gemini-2.5-flash-lite'`

### Change B: TTS function (lines 525-538)
- Change `eleven_turbo_v2_5` to `eleven_flash_v2_5`
- Change `output_format=mp3_44100_128` to `output_format=ulaw_8000`
- Change upload content type from `audio/mpeg` to `audio/basic`
- Change file extension from `.mp3` to `.wav`

### Change C: Parallelize in handleProcess (lines 434-451)
Run the DB save and TTS generation concurrently using `Promise.all`:

```typescript
// Run DB save and TTS generation in parallel
const [_, replyAudioUrl] = await Promise.all([
  // Save conversation state (non-blocking)
  callLogId && !callLogId.startsWith('incoming_')
    ? supabase.from('call_logs').update({
        metadata: { conversation_history: conversationHistory, collected_info: collectedInfo },
      }).eq('id', callLogId)
    : Promise.resolve(),
  // Generate TTS audio
  elevenlabsApiKey
    ? ttsAudioUrl(supabase, companyId, reply, elevenlabsApiKey, elevenlabsVoiceId)
    : Promise.resolve(null),
]);
```

## Expected Improvement

| Step | Before | After |
|------|--------|-------|
| AI response | 3-5s (flash) | 1-2s (flash-lite) |
| TTS generation | 2-3s (turbo, mp3 44kHz) | 0.5-1s (flash, ulaw 8kHz) |
| Storage upload | 1-2s (large mp3) | 0.2-0.5s (small ulaw) |
| DB save | 0.3s (sequential) | 0s (parallel with TTS) |
| **Total** | **6-10s** | **2-3.5s** |

## No changes needed for web voice
Web voice chat uses ElevenLabs WebRTC directly and doesn't go through this pipeline.

