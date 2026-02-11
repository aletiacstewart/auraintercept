

## Fix: Remove Conversation Overrides Causing Agent Disconnect

### Root Cause

The previous fix added `overrides` to `conversation.startSession()`, but:
1. The ElevenLabs React SDK v0.12.1 serializes ALL override fields (including ones we didn't set like `language`, `voice_id`, `text_only`) as explicit `undefined` values in `conversation_config_override`
2. Per ElevenLabs docs, overrides **must be enabled in the ElevenLabs Web UI** for the specific agent — if not enabled, the agent rejects the override payload and silently disconnects
3. The Aura Intercept agent already has its first message and prompt configured in the ElevenLabs dashboard, so overrides are unnecessary

### Fix

**File: `src/components/ai/VoiceChat.tsx`**

Remove the override-building logic and pass NO overrides to `startSession()`. The agent will use its own configured greeting and prompt from the ElevenLabs dashboard.

Changes:
- Remove the override object construction (lines 377-386)
- Remove `overrides` parameter from all three `startSession` calls (WebRTC, WebSocket signed URL, WebSocket agent ID)
- Keep all other reliability improvements (audio pre-creation, force-play interval, connection timeout)

### Why This Fixes It

The agent connects, receives no conflicting overrides, uses its own configured first message, speaks the greeting, and the conversation proceeds normally. The connection timeout safety net remains in case there are other issues.

### Technical Details

```text
Before: startSession({ conversationToken, connectionType: "webrtc", overrides: {...} })
After:  startSession({ conversationToken, connectionType: "webrtc" })
```

