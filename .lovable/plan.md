

# Fix: Phone Call Disconnects After Second Response ("consultation")

## Root Cause

The first fix worked -- the bridging message plays correctly now. But when the caller answers "consultation," the `ai-agent-chat` function executes **multiple tool calls** (get_services, get_available_times) before responding. Combined with TTS generation and storage upload, the total processing takes **7+ seconds**. SignalWire has a webhook response timeout (typically 5-10 seconds) and hangs up when the voice-handler doesn't return TwiML fast enough.

Timeline from logs:
```text
15:12:02  "consultation" received by voice-handler
15:12:06  AI iteration 1: calls get_services tool
15:12:07  AI iteration 2: calls get_available_times tool
15:12:07  AI text response ready: "I can help you with a consultation..."
15:12:09  TTS audio uploaded to storage
15:12:17  Edge function shuts down -- but SignalWire already gave up
```

## The Fix: Immediate TwiML Response + Background Processing

Instead of making the caller wait while the AI thinks, return an **immediate "hold" TwiML response** with a brief message like "Let me check on that for you," then redirect back to pick up the real AI answer.

### Strategy: Two-Phase Response

**Phase 1 (immediate, under 3 seconds):** Return TwiML that plays a brief hold message, then redirects back to the voice-handler after a short pause.

**Phase 2 (background):** While the hold message plays, a parallel process calls the AI and generates TTS. When the redirect hits, the response is ready.

### File: `supabase/functions/voice-handler/index.ts`

Modify `handleProcess` (line ~396):

1. **Start the AI call as a background promise** -- don't await it immediately
2. **Race against a 3-second timer** -- if the AI + TTS finishes in under 3 seconds, return normally
3. **If it exceeds 3 seconds**, save the pending request to the call_logs metadata, return a brief "hold" TwiML (`<Say>One moment please</Say><Pause length="3"/><Redirect>voice-handler?action=process&callLogId=X&pickup=true</Redirect>`)
4. **On the pickup redirect**, check if the AI response is now stored in call_logs metadata. If yes, generate TTS and respond. If not yet ready, play another brief pause and redirect again (max 3 retries before using a fallback response).

```typescript
// Simplified flow in handleProcess:

// 1. Fire off AI request (don't await yet)
const aiPromise = fetchAIResponse(supabaseUrl, supabaseKey, speechResult, systemPrompt, companyId, activeAgent, conversationHistory);

// 2. Race: AI vs 3-second deadline
const timer = new Promise(resolve => setTimeout(() => resolve('timeout'), 3000));
const result = await Promise.race([aiPromise, timer]);

if (result === 'timeout') {
  // AI is still thinking -- save pending state, return hold message
  await supabase.from('call_logs').update({
    metadata: { ...existingMetadata, pending_speech: speechResult, ai_pending: true }
  }).eq('id', callLogId);

  // Kick off background processing (fire-and-forget)
  fetch(`${supabaseUrl}/functions/v1/voice-handler?action=process-background&callLogId=${callLogId}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ speechResult, systemPrompt, companyId, activeAgent, conversationHistory }),
  }).catch(() => {}); // fire and forget

  const holdUrl = `${supabaseUrl}/functions/v1/voice-handler?action=pickup&callLogId=${callLogId}`;
  return twimlResponse(`
    <Say voice="Polly.Joanna">One moment please.</Say>
    <Pause length="4"/>
    <Redirect method="POST">${escapeXmlUrl(holdUrl)}</Redirect>
  `);
}

// AI responded in time -- proceed normally with TTS
const reply = result.response;
// ... generate TTS, return Gather as before
```

### New Action: `pickup`

A new action handler that checks if the background AI processing has completed:

```typescript
case 'pickup':
  return await handlePickup(supabase, supabaseUrl, supabaseKey, callLogId);
```

The `handlePickup` function:
- Reads `call_logs.metadata` for the pending AI response
- If `ai_pending` is still true (not ready), play another short pause and redirect again (up to 3 times)
- If the response is ready, generate TTS and return a normal Gather
- After 3 retries, use a generic fallback: "Could you tell me a bit more about what you need?"

### New Action: `process-background`

A fire-and-forget handler that:
- Calls `ai-agent-chat` with the saved speech
- Saves the AI response text into `call_logs.metadata.pending_response`
- Sets `ai_pending: false`

This runs as a separate edge function invocation so it doesn't block the TwiML response.

## Expected Result

| Step | Before (broken) | After (fixed) |
|------|-----------------|---------------|
| Caller says "consultation" | 7s silence, SignalWire timeout, hangup | Immediate "One moment please" |
| AI processes + tools | Blocked the TwiML response | Runs in background |
| After 4 seconds | Call already dead | Pickup redirect finds AI answer ready |
| Caller hears | Nothing (disconnected) | "I can help you with a consultation. What day works best?" |

## No Database Changes Needed

Uses existing `call_logs.metadata` JSONB column to store pending state.

## Summary of Changes

| File | Change |
|------|--------|
| `supabase/functions/voice-handler/index.ts` | Add Promise.race timeout pattern to handleProcess, add `pickup` and `process-background` action handlers |

