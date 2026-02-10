

# Fix: Prevent Phone Call Timeouts with Aggressive Latency Guards

## Root Cause

The voice-handler calls ai-agent-chat with NO timeout protection. If the AI gateway is even slightly slow (cold start, rate limit queuing, etc.), the entire chain exceeds SignalWire's ~15s webhook timeout and the call drops.

The chain right now:
```text
SignalWire webhook --> voice-handler --> DB lookups (1s) --> ai-agent-chat --> AI Call 1 (2-5s) --> tool exec (0.5s) --> AI Call 2 follow-up (2-5s) --> return --> TTS (1-2s) --> upload (0.5s) --> return TwiML
                                                                                                                                        Total: 7-14s (too close to 15s limit)
```

Two problems:
1. Phone calls still trigger data-fetching tools (`collect_customer_info`, `track_appointment`, `list_services`, `capture_lead`) which force a follow-up AI call -- doubling AI latency
2. No AbortController timeout on the ai-agent-chat fetch, so if the AI is slow, voice-handler hangs until SignalWire gives up

## The Fix (2 changes)

### Change 1: Add 8-second timeout to ai-agent-chat fetch (voice-handler)

**File:** `supabase/functions/voice-handler/index.ts` (lines 394-410)

Wrap the fetch call with an AbortController that aborts after 8 seconds. If it times out, return a short fallback response instead of hanging forever.

```typescript
// In handleProcess, around line 394:
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 8000);

try {
  const aiResponse = await fetch(`${supabaseUrl}/functions/v1/ai-agent-chat`, {
    method: 'POST',
    headers: { ... },
    body: JSON.stringify({ ... }),
    signal: controller.signal,
  });
  clearTimeout(timeout);
  // ... process response
} catch (err) {
  clearTimeout(timeout);
  if (err.name === 'AbortError') {
    reply = "I'm sorry, I'm having a moment. Could you repeat that?";
  } else {
    throw err;
  }
}
```

This ensures voice-handler ALWAYS returns TwiML to SignalWire within ~10-11 seconds (8s AI + 2s TTS), well under the 15s limit.

### Change 2: Strip data-fetching tools for phone channel (ai-agent-chat)

**File:** `supabase/functions/ai-agent-chat/index.ts` (lines 2686-2690)

The current filter only removes `list_services` and `query_business_data`. But other tools like `collect_customer_info`, `track_appointment`, `capture_lead` also trigger the expensive follow-up AI loop. For phone calls, only keep `handoff_to_agent` -- the triage agent just needs to route the caller.

```typescript
// Line 2686-2690: Replace current filter with phone-only whitelist
tools: isPhoneChannel ? tools.filter((t: any) => {
  const name = t.function?.name;
  // Phone: only allow handoff (routing) -- no data tools that trigger follow-up loops
  return name === 'handoff_to_agent';
}) : tools,
```

Apply the same filter at line 2831 (follow-up call).

This eliminates the follow-up AI call entirely for phone -- the AI either responds with text or triggers a handoff, done in one round trip.

## Expected Timing After Fix

```text
SignalWire webhook --> voice-handler --> DB lookups (1s) --> ai-agent-chat --> AI Call 1 only (1-2s) --> return --> TTS (1-2s) --> upload (0.5s) --> return TwiML
                                                                                                                     Total: 3.5-5.5s (safely under 15s)
```

Even in the worst case (8s AI timeout + 2s TTS), the response returns in ~11s -- still under the limit, and the caller hears "Could you repeat that?" instead of a dead line.

## No database changes needed

