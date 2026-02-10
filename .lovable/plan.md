

# Fix: Voice Chat Immediately Disconnecting

## Problem

The "Start Voice Chat" button connects to ElevenLabs, gets a valid token, starts a WebRTC session, then immediately disconnects (under 2 seconds). The auto-retry fallback never fires because the edge function only provides a WebRTC token -- it never fetches a WebSocket signed URL as a fallback.

## Root Cause

1. The `elevenlabs-conversation-token` edge function only calls the ElevenLabs `/conversation/token` endpoint (WebRTC)
2. It never calls `/conversation/get-signed-url` (WebSocket fallback)
3. In `VoiceChat.tsx`, the auto-retry at line 88 checks `lastAuthRef.current?.signed_url` which is always `undefined`
4. WebRTC connections can fail in embedded/preview iframe environments

## Solution

### 1. Update edge function to return BOTH token and signed_url

Modify `supabase/functions/elevenlabs-conversation-token/index.ts` to make two parallel calls to ElevenLabs:
- `/v1/convai/conversation/token` for WebRTC token
- `/v1/convai/conversation/get-signed-url` for WebSocket fallback

Return both values in the response:
```json
{
  "token": "...",
  "signed_url": "wss://...",
  "agentId": "agent_..."
}
```

### 2. Fix the `finally` block race condition in VoiceChat.tsx

Remove `setIsConnecting(false)` from the `finally` block (line 266). The `onConnect` callback at line 69 and `onDisconnect` at line 80 already handle this. The `finally` block fires immediately after `startSession` resolves, which can be before the connection is fully established, causing a brief UI flash.

Only set `setIsConnecting(false)` in the `catch` block (on actual errors).

### 3. Improve fallback logic in VoiceChat.tsx

Update the auto-retry in `onDisconnect` to also try the `agentId` with WebSocket as a last resort if no signed_url is available:

```
WebRTC (token) --> WebSocket (signed_url) --> WebSocket (agentId)
```

## Changes

| File | Change |
|------|--------|
| `supabase/functions/elevenlabs-conversation-token/index.ts` | Fetch both token and signed_url from ElevenLabs in parallel |
| `src/components/ai/VoiceChat.tsx` | Remove `setIsConnecting(false)` from finally block; add agentId WebSocket as last-resort fallback |

