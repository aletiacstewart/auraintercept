

# Fix Voice Chat — Remove Broken Overrides That Kill Audio

## Root Cause

The console logs prove exactly what's happening:

1. WebRTC connects successfully ("onConnect fired")
2. ElevenLabs receives malformed override data where `prompt.prompt` shows `MaxDepthReached` (an object nesting error)
3. ElevenLabs immediately disconnects the session — no audio ever plays
4. `isSpeaking` stays `false` the entire time

The overrides structure added in the last edit is incompatible with the ElevenLabs React SDK v0.12.1. The SDK serializes the overrides object and the nested `{ prompt: { prompt: string } }` gets corrupted.

## Fix

**Remove all override logic from VoiceChat.tsx.** The ElevenLabs agent (agent_3601kg17fsmdfcnajfjfjsnbsspf) should already have its greeting and prompt configured in the ElevenLabs dashboard. Passing overrides from the client is unnecessary and is actively breaking the connection.

### Changes to `src/components/ai/VoiceChat.tsx`

1. Delete the overrides block (lines 286-293) that builds the `overrides` object
2. Remove `overrides` from all three `startSession()` calls (lines 310-328)
3. Keep everything else exactly the same — the connection logic, fallback strategy, and audio context handling are all correct

### No other files need changes

The edge function can continue returning `firstMessage` and `systemPrompt` — they just won't be used as client overrides. This data may be useful for future features (like displaying the greeting as text).

## Expected Result

After this fix:
- WebRTC connects to the agent
- ElevenLabs receives a clean session request with no malformed overrides
- The agent speaks its configured greeting
- Two-way audio works normally

