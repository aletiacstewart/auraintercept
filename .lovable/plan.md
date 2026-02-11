

## Clean Rewrite: VoiceChat Component

### Problem

The current VoiceChat.tsx is 654 lines with accumulated debugging hacks (AudioContext unlock, force-play intervals, connection timeouts, debug badges, auto-retry refs) that obscure the actual issue and make debugging impossible. Despite multiple fix attempts, the agent connects then immediately disconnects.

### Approach

Strip the component down to a clean, minimal implementation that follows the ElevenLabs React SDK documentation exactly. Keep text mode separate and untouched.

### Changes

**File: `src/components/ai/VoiceChat.tsx`** -- Full rewrite

The new component will:

1. Use `useConversation` hook with only `onConnect`, `onDisconnect`, `onMessage`, `onError` callbacks
2. Call `startSession` with ONLY `{ agentId, connectionType: "webrtc" }` -- no token fetching, no signed URL fallback, no dual-path logic. Use the public agent connection first to verify the agent works at all
3. Remove all "reliability" hacks (AudioContext unlock, force-play interval, connection timeout, debug badge) -- these were masking the real problem
4. Keep text mode (test mode) logic intact since it works fine
5. Request microphone permission on button click, then immediately start session

### Simplified Voice Flow

```text
User clicks "Start Voice Chat"
  -> getUserMedia({ audio: true })
  -> conversation.startSession({ agentId, connectionType: "webrtc" })
  -> onConnect fires -> show "Connected"
  -> onDisconnect fires -> show "Ended"
```

### Why This Will Work

By removing the token-based authentication layer and connecting directly with `agentId`, we eliminate the edge function as a failure point. If the agent still disconnects immediately with this minimal setup, the problem is in the ElevenLabs agent configuration itself (not our code), and we'll know exactly where to look.

If the direct `agentId` connection works, we can then layer back token-based auth as a second step.

### Edge Function

No changes to `elevenlabs-conversation-token` -- we're bypassing it initially to isolate the issue. Once the direct connection works, we'll re-add token auth.

### Files Changed

- `src/components/ai/VoiceChat.tsx` -- Clean rewrite with minimal voice connection logic

