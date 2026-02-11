

## Deep Dive Fix: AI Voice Chat — No Audio Output

### Root Cause

The ElevenLabs conversation connects successfully via WebRTC but the agent never speaks and disconnects within seconds. Analysis of the debug logs shows the SDK is sending `conversation_config_override` with all fields set to `undefined`. This likely causes the ElevenLabs backend to interpret those as intentional overrides (clearing the agent's configured first message and prompt), resulting in an agent that has nothing to say and immediately ends the session.

The edge function (`elevenlabs-conversation-token`) returns `firstMessage` and `systemPrompt` from the database, but `VoiceChat.tsx` never uses them.

### Fix Plan

#### 1. Pass `firstMessage` and `systemPrompt` as overrides in `startSession`

In `VoiceChat.tsx`, after receiving the token response, pass the first message and system prompt as conversation overrides so the agent knows what to say on connect:

```tsx
// In startConversation callback, after getting token data:
const overrides: any = {};
if (data?.firstMessage) {
  overrides.agent = {
    firstMessage: data.firstMessage,
    prompt: data.systemPrompt ? { prompt: data.systemPrompt } : undefined,
  };
}

await conversation.startSession({
  conversationToken: data.token,
  connectionType: "webrtc",
  overrides: Object.keys(overrides).length > 0 ? overrides : undefined,
});
```

This ensures the agent always has a greeting to speak and a prompt to follow, even if the ElevenLabs agent dashboard config is minimal.

#### 2. Add audio element pre-creation for autoplay compliance

Per the proven browser autoplay solution, create an `Audio` element synchronously during the user's click gesture (before async work). This ensures the browser trusts audio playback:

```tsx
// At the top of startConversation, before any await:
const preloadAudio = new Audio();
preloadAudio.preload = "auto";
```

#### 3. Improve the audio force-play interval

The current interval only looks for `el.srcObject` (WebRTC). Expand it to also handle `el.src` (WebSocket mode) and add logging to confirm audio elements are being found.

#### 4. Add connection timeout protection

If the agent doesn't speak within 10 seconds of connecting, show a toast warning and log diagnostics. This prevents the user from staring at a "Listening..." state with no feedback.

### Files Changed

- `src/components/ai/VoiceChat.tsx` — Pass overrides to `startSession`, pre-create Audio element, improve force-play logic, add connection timeout

### What This Does NOT Fix

- If the ElevenLabs agent itself is misconfigured on their platform (wrong model, no voice assigned), that needs to be fixed in the ElevenLabs dashboard
- If the ElevenLabs workspace has run out of credits, no code change will help
- If the agent ID is invalid, the token will still be issued but the conversation will fail

