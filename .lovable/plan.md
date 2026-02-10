

# Fix: Voice Chat - No Audio on Start

## Diagnosis

The backend is fully functional:
- The `elevenlabs-conversation-token` edge function returns valid `token`, `signed_url`, and `agentId`
- The ElevenLabs agent (`agent_3601kg17fsmdfcnajfjfjsnbsspf`) is configured with an API key
- The SignalWire phone system is completely separate and has no impact on web voice chat

The issue is on the **frontend audio pipeline**. Two likely causes:

1. **AudioContext unlock is async** - The current code uses `await ctx.resume()` which breaks the synchronous user-gesture chain. The browser may not recognize subsequent audio playback as user-initiated.

2. **No connection feedback** - There are no diagnostic logs visible to confirm whether the connection succeeds or fails silently. The user sees "Connecting..." but gets no audio and no error.

## Changes

### 1. Fix AudioContext unlock to be truly synchronous (`VoiceChat.tsx`)

The current `await ctx.resume()` breaks the user-gesture trust chain. Instead, create the AudioContext **without awaiting**, and store it so the ElevenLabs SDK can reuse the unlocked audio context.

```typescript
// BEFORE (broken - await breaks gesture chain)
const ctx = new AudioContext();
await ctx.resume();  // <-- This can break the chain

// AFTER (correct - fire-and-forget, non-blocking)
const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
ctx.resume();  // No await - keeps us in the gesture context
```

### 2. Add detailed diagnostic logging (`VoiceChat.tsx`)

Add console logs at every critical step so we (and the user) can see exactly where audio fails:
- Log when AudioContext is created and its state
- Log the connection method chosen
- Log when `onConnect` fires
- Log when `onMessage` receives audio/transcript events
- Log `conversation.isSpeaking` changes

### 3. Add a visible status indicator for debugging

Show a small debug badge during connection that displays:
- Connection method (WebRTC vs WebSocket)
- Whether AudioContext is in "running" state
- Whether the agent is speaking

This will be invaluable for diagnosing "it connects but no audio" vs "it never connects."

### 4. Force WebSocket as the default connection method

WebRTC has consistently caused silent failures in this environment. Change the default strategy to **always prefer WebSocket (signed_url)** regardless of iframe status, falling back to WebRTC only if no signed_url is available.

```
Connection priority (new):
1. WebSocket (signed_url) -- most reliable
2. WebSocket (agentId)    -- fallback
3. WebRTC (token)         -- last resort
```

## Files Changed

| File | Change |
|------|--------|
| `src/components/ai/VoiceChat.tsx` | Fix AudioContext unlock (remove await), switch default to WebSocket, add diagnostic logging and debug status indicator |

## Why Not SignalWire-Related

- SignalWire handles phone calls via `voice-handler`, `outbound-call`, and `missed-call-handler` edge functions
- Web voice chat uses ElevenLabs React SDK (`useConversation` hook) and the `elevenlabs-conversation-token` edge function
- These are completely independent systems with no shared code paths
