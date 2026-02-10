

# Fix: Voice Handler Not Passing Company ID to AI Chat

## Problem

When you say "I'd like to book an appointment," the voice-handler calls the AI chat function but doesn't include the `companyId` or `agentType` in the request. The AI chat function receives `undefined` for both, crashes with "invalid input syntax for type uuid: undefined", and the voice-handler's error handler says "Goodbye" and hangs up.

## The Fix

Add `companyId` and `agentType: 'phone'` to the request body sent from the voice-handler to the AI chat function. The `companyId` is already available in the `handleProcess()` function -- it just isn't being passed along.

## Technical Details

**File:** `supabase/functions/voice-handler/index.ts`

**Change:** Update the `ai-agent-chat` fetch call (around line 397) to include the missing fields:

```typescript
body: JSON.stringify({
  message: speechResult,
  systemPrompt,
  model: 'google/gemini-2.5-flash',
  companyId,                    // ADD THIS
  agentType: 'phone',           // ADD THIS
  isInternalRequest: true,      // ADD THIS - bypasses customer auth checks
}),
```

Adding `isInternalRequest: true` ensures the AI chat function treats this as a service-to-service call (from the voice system) and skips customer-facing validation like user association checks that would fail since there's no logged-in user on a phone call.

This is a 3-line addition in one file. No database changes needed.
