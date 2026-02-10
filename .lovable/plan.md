

# Fix: Switch to Built-in Voice So Calls Actually Connect

## The Problem

Everything on our side is working correctly:
- Custom Aura Intercept prompt: loaded from database
- Services: 1 active service loaded ("Aura Intercept Consultation, 45 min")
- SWML document: returned successfully (HTTP 200, no errors)
- SWAIG argument parsing: fixed
- Status filter: fixed

But SignalWire **crashes before any of this runs** because the voice string `elevenlabs.cgSgspJ2msm6clMCkdW9:eleven_flash_v2_5` references a custom/cloned ElevenLabs voice that requires an API key configured in SignalWire's dashboard. Without it, SignalWire cannot initialize the AI block and plays "your call cannot be completed."

## The Fix

### 1. Change voice to built-in Rachel in `voice-handler/index.ts` (line 125-129)

Replace the current voice logic:
```typescript
const isCustomVoice = voiceId && voiceId.length > 15 && ...;
if (isCustomVoice) { console.log(...); }
const voice = `elevenlabs.${voiceId}:eleven_flash_v2_5`;
```

With a fallback that uses a known built-in voice:
```typescript
// Built-in ElevenLabs voices that work without an API key in SignalWire
const BUILTIN_VOICES = ['Rachel', 'Sarah', 'Laura', 'Charlie', 'George', 'Aria', 'Roger'];
const isBuiltIn = BUILTIN_VOICES.includes(voiceId);

let voice: string;
if (isBuiltIn) {
  voice = `elevenlabs.${voiceId}`;
} else {
  // Custom voice ID requires ElevenLabs API key in SignalWire dashboard
  // Fall back to Rachel (professional female voice) to prevent call failure
  console.warn(`Custom ElevenLabs voice "${voiceId}" requires API key in SignalWire. Falling back to Rachel.`);
  voice = 'elevenlabs.Rachel';
}
```

This is the ONLY change needed. Once this is deployed:
- Calls will connect immediately
- The AI will use the Rachel voice (professional, female)
- Your custom Aura Intercept prompt will finally be heard
- Services, booking, availability -- all the fixes we already made will work

### 2. To get your custom Jessica voice back later

You need to add your ElevenLabs API key in SignalWire:
1. Log into your SignalWire Space
2. Go to Integrations or AI/TTS settings
3. Add your ElevenLabs API key
4. Once confirmed, we change the fallback logic to allow custom IDs through

## No Database Changes

Single line change in `voice-handler/index.ts`.

