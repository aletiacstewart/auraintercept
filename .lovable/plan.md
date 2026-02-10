

# Fix: Phone Call Says "Someone Will Get Back" Instead of AI Response

## Root Cause (3 Bugs Found)

### Bug 1: No HTTP Error Checking on AI Response
In `voice-handler/index.ts` line 504, the code does:
```typescript
const aiText = await aiResponse.text();
const aiData = JSON.parse(aiText);
reply = aiData.reply || aiData.response || aiData.message || reply;
```
There is **no check for `aiResponse.ok`**. If `ai-agent-chat` returns a 500 error like `{"error": "Failed to process request"}`, the JSON parses fine but none of `reply`, `response`, or `message` exist in the error object. So the default fallback `"Thank you for your message. Someone will get back to you shortly."` is used -- the exact message you're hearing.

### Bug 2: 8-Second Timeout Is Too Aggressive
The `AbortController` at line 480 aborts after only 8 seconds. SignalWire actually allows **15-30 seconds** for `action` callback URLs (like the Gather action that triggers `handleProcess`). The 8-second limit causes the AI call to abort even when it would have succeeded in 9-10 seconds.

When the abort fires, the fallback is "I'm sorry, could you repeat that?" -- but that doesn't match what you're hearing. This means the AI call IS completing (not timing out), but it's returning an error that isn't being caught.

### Bug 3: The Default Reply Is a Dead End
The default at line 482 says "Someone will get back to you shortly" and then plays TTS + Gather. But the message gives the caller the impression the call is over, when really the system is still listening. It should be a conversational retry, not a goodbye.

## The Fix (1 file: voice-handler/index.ts)

### Change 1: Check `aiResponse.ok` Before Parsing
Add proper HTTP status checking. If the AI returns an error, log it and use a conversational fallback instead of the dead-end message.

```typescript
// After the fetch call:
clearTimeout(aiTimeout);

if (!aiResponse.ok) {
  console.error(`[voice-handler] AI returned ${aiResponse.status}: ${await aiResponse.text()}`);
  reply = "I didn't quite catch that. Could you tell me again what you need help with?";
} else {
  const aiText = await aiResponse.text();
  try {
    const aiData = JSON.parse(aiText);
    reply = aiData.response || aiData.reply || aiData.message || reply;
    // ... handoff tracking
  } catch {
    if (aiText && aiText.length < 500) reply = aiText;
  }
}
```

### Change 2: Increase Timeout from 8s to 12s
SignalWire waits 15-30 seconds for action callbacks. Increasing to 12 seconds gives the AI plenty of room while still leaving 3-5 seconds for TTS generation before the absolute limit.

```typescript
const aiTimeout = setTimeout(() => controller.abort(), 12000); // was 8000
```

### Change 3: Fix the Default Reply
Change the dead-end default to a conversational prompt that keeps the caller engaged:

```typescript
let reply = "I didn't quite catch that. Could you tell me again how I can help you?";
// was: "Thank you for your message. Someone will get back to you shortly."
```

### Change 4: Also fix `aiData.response` field priority
The `ai-agent-chat` returns `response` (not `reply`). Put `response` first in the OR chain:

```typescript
reply = aiData.response || aiData.reply || aiData.message || reply;
// was: aiData.reply || aiData.response || aiData.message || reply
```

## Expected Result

| Scenario | Before | After |
|----------|--------|-------|
| AI succeeds | Works (sometimes) | Works (reliably) |
| AI returns error | "Someone will get back to you" (dead end) | "Could you tell me again?" (keeps conversation going) |
| AI times out (>12s) | Cuts off at 8s | "Could you repeat that?" at 12s |

## No database changes needed

