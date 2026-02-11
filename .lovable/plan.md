

## Fix: Revert to useConversation Hook (Remove Raw Conversation Class)

### Root Cause

The refactor from `useConversation` hook to the raw `Conversation` class from `@elevenlabs/client` removed critical audio pipeline setup. The hook internally configures microphone input, audio output, and proper WebRTC/WebSocket lifecycle management. The raw class requires explicit input/output configuration that our code doesn't provide, causing the connection to establish briefly then immediately drop.

The original concern about the hook "injecting overrides" was incorrect -- the hook only sends overrides if you explicitly pass them. The previous code was explicitly constructing override objects with `undefined` values, which the hook dutifully sent.

### Fix

Revert `VoiceChat.tsx` to use the `useConversation` hook from `@elevenlabs/react`, but call `startSession` with ONLY the connection config (token/signedUrl/agentId) and NO overrides.

### Changes to `src/components/ai/VoiceChat.tsx`

1. **Replace import**: Change `import { Conversation } from "@elevenlabs/client"` back to `import { useConversation } from "@elevenlabs/react"`

2. **Remove manual state management**: Delete `conversationRef`, `convStatus`, `convIsSpeaking` state variables and the manual cleanup `useEffect`

3. **Replace `buildSessionCallbacks` + `startDirectSession`** with the `useConversation` hook:
   ```
   const conversation = useConversation({
     onConnect: () => { ... },
     onDisconnect: () => { ... },
     onMessage: (message) => { ... },
     onError: (error) => { ... },
   });
   ```

4. **Update startSession calls** to use `conversation.startSession()` with NO overrides:
   - WebRTC: `conversation.startSession({ conversationToken: data.token, connectionType: "webrtc" })`
   - WebSocket signed URL: `conversation.startSession({ signedUrl: data.signed_url })`
   - WebSocket agent ID: `conversation.startSession({ agentId, connectionType: "websocket" })`

5. **Update state references**:
   - `convStatus` references become `conversation.status`
   - `convIsSpeaking` references become `conversation.isSpeaking`
   - `conversationRef.current.endSession()` becomes `conversation.endSession()`
   - `conversationRef.current.setVolume()` becomes `conversation.setVolume()`

6. **Keep all reliability features**: AudioContext unlock, force-play interval, connection timeout, and debug badge all remain

### Why This Works

The `useConversation` hook from `@elevenlabs/react` wraps the `Conversation` class and handles:
- Microphone input stream acquisition and piping
- Audio output device configuration
- Proper WebRTC peer connection lifecycle
- State synchronization (status, isSpeaking)
- Cleanup on unmount

Without overrides being passed, the ElevenLabs agent will use its dashboard-configured first message and prompt.

### Files Changed

- `src/components/ai/VoiceChat.tsx` -- Revert to `useConversation` hook, remove raw `Conversation` class usage

### Not a SignalWire Conflict

SignalWire handles phone calls through separate edge functions (`voice-handler`, `voice-swaig`). The web voice chat uses ElevenLabs directly via WebRTC/WebSocket. These two systems are completely independent and do not interact.
