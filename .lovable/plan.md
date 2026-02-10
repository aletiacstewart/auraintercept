

# Fix: Speed Up Phone Booking from 15s to ~4s

## Why Phone Booking Matters

Customers call the business number -- that's the primary way most people interact with a local business. Removing phone booking would force callers to hang up and visit a website, which defeats the purpose of having a phone agent. **Keep phone booking, fix the speed.**

## Root Cause: 3 Bugs in ai-agent-chat

When someone says "I want to book an appointment," two sequential AI calls happen:

1. **AI Call 1** (initial): Decides to trigger a tool (e.g., `check_availability` or `handoff_to_agent`)
2. **Tool execution**: Runs the tool (~0.5s)
3. **AI Call 2** (follow-up): Generates the spoken response using tool results

The problem is threefold:

- **Bug A**: `ai-agent-chat` hardcodes `model: 'google/gemini-2.5-flash'` (line 2681), ignoring the `model: 'google/gemini-2.5-flash-lite'` that voice-handler sends. The faster model is never used.
- **Bug B**: Follow-up AI calls (line 2826) don't apply phone limits -- they use full `max_tokens: 1000` and the unfiltered tool list instead of the phone-optimized `max_tokens: 150`.
- **Bug C**: Follow-up calls also hardcode `gemini-2.5-flash` instead of using the requested model.

```text
Current flow (booking request):
  AI Call 1 (flash, 3-5s) --> Tool exec (0.5s) --> AI Call 2 (flash, 3-5s) --> TTS (1.5s) = ~10-15s

Fixed flow:
  AI Call 1 (flash-lite, 1-2s) --> Tool exec (0.5s) --> AI Call 2 (flash-lite, 1s) --> TTS (1.5s) = ~4-5s
```

## The Fix (1 file: ai-agent-chat/index.ts)

### Change 1: Respect the model from the request (line 2202, 2681)

Extract the `model` field from the request payload (voice-handler already sends it) and use it when provided:

```typescript
// Line 2202 - add 'model' to destructuring:
const { ..., model: requestModel } = await req.json();

// Create a resolved model variable:
const selectedModel = (isInternalRequest && requestModel) || 'google/gemini-2.5-flash';

// Line 2681 - use the resolved model:
model: selectedModel,  // was: 'google/gemini-2.5-flash'
```

### Change 2: Apply phone limits to follow-up AI calls (lines 2826-2831)

The follow-up call after tool execution must also use phone-optimized settings:

```typescript
// Line 2826-2831 - apply same optimizations:
body: JSON.stringify({
  model: selectedModel,  // was: 'google/gemini-2.5-flash'
  messages,
  tools: isPhoneChannel ? tools.filter((t: any) => {
    const name = t.function?.name;
    return name !== 'list_services' && name !== 'query_business_data';
  }) : tools,  // was: tools (unfiltered)
  tool_choice: 'auto',
  temperature: 0.7,
  max_tokens: isPhoneChannel ? 150 : 1000,  // was: 1000
}),
```

### Change 3: Extract `model` from request body

Add `model` to the destructured request payload at line 2202 so it's available throughout the function.

## No Changes to voice-handler

voice-handler already sends the correct model and channel. The problem is entirely in ai-agent-chat ignoring those values.

## Expected Improvement

| Step | Before | After |
|------|--------|-------|
| AI Call 1 | 3-5s (gemini-2.5-flash) | 1-2s (flash-lite) |
| Tool execution | 0.5s | 0.5s |
| AI Call 2 (follow-up) | 3-5s (flash, 1000 tokens) | 0.5-1s (flash-lite, 150 tokens) |
| TTS + Upload | 1.5-2s | 1.5-2s |
| **Total** | **8-15s** | **3.5-5.5s** |

## Multi-tenant safe

The `selectedModel` variable only applies when `isInternalRequest` is true (phone calls from voice-handler). External web chat requests continue using `gemini-2.5-flash` at full capacity. All tenants benefit equally since they share the same code path.
