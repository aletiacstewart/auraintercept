

## Fix: Voice Chat Appointments Not Being Created

### Root Cause

The `VoiceChat.tsx` connects to ElevenLabs via `agentId` with `connectionType: "webrtc"`, but has **no `clientTools` defined**. This means all tool calls (like `create_appointment`, `check_availability`, `get_services`) rely entirely on ElevenLabs' server-side webhook to reach your `voice-booking-agent` edge function. If ElevenLabs cannot reach the edge function (URL misconfiguration, authentication, or network issues on their end), the tool call silently fails -- the AI may say "I've booked that for you" but nothing actually gets created in the database.

The edge function logs confirm this: there were **zero tool call invocations** during your voice chat session. Only a "shutdown" log exists.

### Solution

Implement **client-side tool interception** using ElevenLabs' `clientTools` option in the `useConversation` hook. This routes tool calls through the user's browser to the edge function, bypassing the unreliable server-to-server path.

### Changes

**File: `src/components/ai/VoiceChat.tsx`**

1. Add three `clientTools` to the `useConversation` hook:
   - `get_services` -- calls `voice-booking-agent` with `toolName: "get_services"`
   - `check_availability` -- calls `voice-booking-agent` with `toolName: "check_availability"` and passes the `preferred_date` parameter
   - `create_appointment` -- calls `voice-booking-agent` with `toolName: "create_appointment"` and passes customer details (name, phone, service, datetime, duration)

2. Each client tool will:
   - Invoke the `voice-booking-agent` edge function via `supabase.functions.invoke()`
   - Pass the `agentId` so the function can resolve the `company_id`
   - Return the response data (message, slots, appointment details) back to the ElevenLabs agent so it can speak the result

3. The tool names in `clientTools` must exactly match the tool names configured in the ElevenLabs agent dashboard.

### How It Works

```text
Before (broken):
  User speaks --> ElevenLabs Agent --> (server webhook) --> voice-booking-agent
                                       ^ This path is failing silently

After (fix):
  User speaks --> ElevenLabs Agent --> clientTools (browser) --> voice-booking-agent
                                       ^ Reliable, runs in user's browser
```

### Technical Notes

- `clientTools` functions return a string value that gets passed back to the ElevenLabs agent as the tool response
- The tools must be configured as "client" tools in the ElevenLabs dashboard (not server tools) for this to work
- Per project memory, no `overrides` are passed to `startSession` (they cause disconnects); `clientTools` are different -- they're part of the hook initialization, not session overrides
- The existing `voice-booking-agent` edge function logic remains unchanged; only the invocation path changes from server-side to client-side

