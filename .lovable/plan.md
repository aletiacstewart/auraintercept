
# Fix: Phone Call Disconnect After Booking Request

## Root Cause (1 Bug)

In `ai-agent-chat/index.ts` line 2916-2931, when a handoff occurs with an empty AI response, the code checks `isInternalAgent`. Because voice-handler sends `isInternalRequest: true`, the code enters the internal agent branch and sets `responseText = ''` (empty). This was intended for admin-facing agents (inventory, campaign, etc.) but phone calls incorrectly get caught by the same check.

The flow:
1. Caller says "I'd like to book an appointment"
2. AI triggers `handoff_to_agent(booking)` with no text (normal for tool calls)
3. Bridging message code runs, sees `isInternalAgent = true` (because `isInternalRequest = true`)
4. Sets `responseText = ''` instead of generating "I'd be happy to help you with booking..."
5. voice-handler gets empty response, falls back to "I didn't quite catch that..."
6. Caller is confused, stays silent, Gather times out at 12s, call hangs up

## The Fix (1 file, 1 change)

### File: `supabase/functions/ai-agent-chat/index.ts` (~line 2916)

Add a check for `channel === 'phone'`. When the request comes from the phone channel, always generate the bridging message regardless of `isInternalAgent`:

**Before:**
```typescript
if (handoffTo && !responseText.trim()) {
  if (isInternalAgent || INTERNAL_AGENTS.includes(handoffTo)) {
    responseText = '';
  } else {
    // bridging messages...
  }
}
```

**After:**
```typescript
if (handoffTo && !responseText.trim()) {
  const isPhoneCall = channel === 'phone';
  if ((isInternalAgent || INTERNAL_AGENTS.includes(handoffTo)) && !isPhoneCall) {
    // For internal dashboard agents, skip customer-facing message
    responseText = '';
  } else {
    // For phone calls and customer-facing channels, always provide a spoken response
    const handoffMessages: Record<string, string> = {
      booking: "I'd be happy to help you book an appointment. What service are you looking for?",
      dispatch: "Let me connect you with our dispatch team right away.",
      quoting: "I can help you get a quote. What service do you need?",
      followup: "Let me connect you with our follow-up team.",
      review: "Thank you for your feedback! Let me help you with that.",
      invoice: "Let me help you with your billing question.",
      default: `Sure, I can help you with that. Could you tell me a bit more?`,
    };
    responseText = handoffMessages[handoffTo] || handoffMessages.default;
  }
}
```

This ensures phone callers always hear a conversational response when a handoff occurs, while dashboard internal agents continue to work silently as intended.

## Expected Result

| Scenario | Before | After |
|----------|--------|-------|
| Phone: "book appointment" | Empty response, fallback, timeout, hangup | "I'd be happy to help you book. What service?" |
| Dashboard: internal handoff | Silent (correct) | Silent (unchanged) |
| Web chat: handoff | Bridging message | Bridging message (unchanged) |

## No database changes needed
