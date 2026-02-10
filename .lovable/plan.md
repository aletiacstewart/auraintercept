

# Deep Dive Fix: AI Voice System for Phone and Web Calls

## Issues Found

### Phone Calls - 3 Critical Problems

**Problem 1: Phone-specific rules are being ignored**
The voice-handler builds a detailed `systemPrompt` with phone rules (short responses, ask one thing at a time, sequential info collection). It sends this in the request body to `ai-agent-chat`. However, `ai-agent-chat` completely ignores the `systemPrompt` field from the request -- it builds its own system prompt using the built-in `AGENT_PROMPTS.triage` template (line 2487). The phone rules never reach the AI model.

**Problem 2: Multi-step tool calls cause timeouts**
When you say "book an appointment", the triage agent calls `list_services` (a tool call), waits for results, then makes a follow-up AI call. This multi-step process takes 5-8 seconds for the AI alone, plus 3-5 seconds for TTS generation. If SignalWire's webhook timeout is exceeded, the call drops.

**Problem 3: Chatbot-style responses don't work on phone**
The triage agent's response lists services with prices, durations, and delivery types -- fine for a web chat, but terrible for a phone call where the caller hears a long monologue read aloud. The phone needs short, conversational responses.

### Web Voice Chat - Separate System, Working Differently
The web voice chat (VoiceChat.tsx) uses ElevenLabs Conversational AI directly via WebRTC -- it does NOT go through `ai-agent-chat` at all. Its behavior is controlled by the ElevenLabs Agent dashboard configuration. This system should work independently as long as the `elevenlabs_agent_id` and `elevenlabs_api_key` are configured correctly in `tenant_integrations`.

## The Fix

### Change 1: Make ai-agent-chat respect phone call context
**File:** `supabase/functions/ai-agent-chat/index.ts` (around line 2487-2608)

When the request includes `isInternalRequest: true` and a custom `systemPrompt` field (from the voice-handler), append the phone-specific rules to the system prompt so the AI knows to keep responses short and conversational.

```text
Before (line 2487):
  const basePrompt = AGENT_PROMPTS[agentType] || "...";

After:
  let basePrompt = AGENT_PROMPTS[agentType] || "...";
  // If caller sent a custom systemPrompt (e.g., phone call rules), append it
  const incomingSystemPrompt = payload.systemPrompt;
  if (incomingSystemPrompt && isInternalRequest) {
    basePrompt += "\n\n" + incomingSystemPrompt;
  }
```

Note: The request body is destructured at line 2202 but `systemPrompt` is not currently extracted. We need to add it to the destructuring.

### Change 2: Add phone-optimized response constraints
**File:** `supabase/functions/voice-handler/index.ts` (lines 390-404)

Pass a `channel: 'phone'` flag alongside the existing fields so ai-agent-chat can apply phone-appropriate behavior (disable tool calls that list long data, limit response length).

```typescript
body: JSON.stringify({
  message: speechResult,
  systemPrompt,
  companyId,
  agentType: 'triage',
  isInternalRequest: true,
  channel: 'phone',
  conversationHistory,  // Pass history so AI has full context
}),
```

### Change 3: Handle channel='phone' in ai-agent-chat to limit tool usage
**File:** `supabase/functions/ai-agent-chat/index.ts`

When `channel === 'phone'`:
- Remove verbose tools like `list_services` from the tool set (the AI shouldn't list 20 services on a phone call)
- Add `max_tokens: 150` to the AI call to enforce short responses
- Add phone-specific rules to the system prompt: "Keep responses to 1-2 short sentences. Do not list items. Ask for one piece of information at a time."

### Change 4: Pass conversation history from voice-handler
**File:** `supabase/functions/voice-handler/index.ts`

Currently, the voice-handler maintains conversation history in `call_logs.metadata` but only passes the latest `message` to ai-agent-chat -- the AI has no context of the previous turns. Send the full `conversationHistory` array so the AI can properly track what info has been collected.

### Change 5: Handle the handoff problem for phone
When the triage agent tries to hand off to the booking agent on a phone call, the voice-handler doesn't handle it -- it just takes the response text and speaks it. The handoff target is lost, meaning subsequent caller responses still go to triage instead of booking.

**File:** `supabase/functions/voice-handler/index.ts` (around line 410)

After parsing the AI response, check for `handoff_to` in the response data. If present, update the `call_logs.metadata` with the new active agent so subsequent speech goes to the right agent:

```typescript
const aiData = JSON.parse(aiText);
reply = aiData.response || aiData.message || reply;

// Track agent handoffs for phone
if (aiData.handoff_to) {
  // Update metadata with new active agent
  collectedInfo._activeAgent = aiData.handoff_to;
}
```

Then in the beginning of `handleProcess`, read the active agent from metadata:

```typescript
const activeAgent = collectedInfo._activeAgent || 'triage';
// Use activeAgent instead of hardcoded 'triage' in the fetch call
```

## Summary of Changes

| File | Change |
|------|--------|
| `supabase/functions/ai-agent-chat/index.ts` | Extract `systemPrompt` and `channel` from request body; append phone rules when channel='phone'; reduce max_tokens and simplify tools for phone |
| `supabase/functions/voice-handler/index.ts` | Pass `channel`, `conversationHistory` to ai-agent-chat; handle `handoff_to` in response; track active agent across turns |

## Expected Result
- Phone calls: Aura will respond with short, natural sentences. She'll ask for one piece of info at a time and properly hand off to the booking agent when needed.
- Web voice: Continues to use ElevenLabs Conversational AI directly (no changes needed -- this is a separate system).
- No database changes required.

