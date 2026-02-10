

# Fix Voice Chat Audio — Remove ALL Overrides (For Real This Time)

## Problem

The last fix added "conditional" overrides, but the edge function **always** returns `firstMessage` and `systemPrompt`, so `hasOverrides` is **always true**. The SDK continues sending the corrupted `MaxDepthReached` payload, and ElevenLabs silences the agent.

## Root Cause

The ElevenLabs React SDK v0.12.1 cannot serialize the `{ prompt: { prompt: string } }` override structure. It produces `MaxDepthReached` errors. This is an SDK bug/limitation — no client-side override will work with this SDK version.

## Fix

**Delete ALL override-related code** from `VoiceChat.tsx`. No conditional logic, no "only if present" — just remove it entirely.

### Changes to `src/components/ai/VoiceChat.tsx`

1. **Remove lines 321-330** — the entire `sessionOverrides` construction block and `hasOverrides` variable
2. **Remove `hasOverrides` from the debug log** on line 340
3. **Clean all three `startSession()` calls** — remove the spread operator that injects overrides:
   - WebRTC call (line 349): remove `...(hasOverrides ? { overrides: sessionOverrides } : {})`
   - WebSocket signed_url call (line 356): same removal
   - WebSocket agentId call (line 364): same removal

### Result

The `startSession` calls become clean:
```tsx
await conversation.startSession({
  conversationToken: data.token,
  connectionType: "webrtc",
});
```

The agent will use its dashboard-configured greeting and prompt. The edge function can keep returning `firstMessage`/`systemPrompt` — we just won't pass them to the SDK.

### No other files change.

