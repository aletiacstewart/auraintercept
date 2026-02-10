

# Fix: Make Jessica Fast, Intuitive, and Responsive

You do NOT need to switch to SignalWire's AI agent. The current system has the right architecture -- the problems are three specific bugs in the voice logic that cause Jessica to repeat herself and feel slow. Here's how we fix them.

## What's Wrong (3 Root Causes)

1. **Two AI calls run at the same time.** When the 3-second timer fires, the original AI call keeps running alongside a new background call. Both produce different answers, and the wrong one often wins -- making Jessica say something that ignores what you just told her.

2. **The AI sees the conversation history twice.** The system prompt includes the full conversation at the bottom ("CONVERSATION SO FAR:..."), AND the same history is sent separately. This confuses the AI into repeating earlier responses instead of moving forward.

3. **The AI model is too slow for phone calls.** The current model (`gemini-2.5-flash-lite`) is cheap but regularly misses the 3-second deadline, triggering the hold loop on almost every turn. This makes Jessica feel unresponsive.

## The Fixes

### Fix 1: Kill the first AI call when the timer fires
When the 3-second deadline passes, the original AI request will be cancelled so only ONE response is ever generated per turn. No more competing answers.

### Fix 2: Remove duplicate conversation history
The conversation history will only be sent once (as a parameter), not embedded in the system prompt too. This gives the AI clean, unambiguous context so it actually listens to what you said.

### Fix 3: Add strict flow rules
New rules will be added to prevent Jessica from re-listing services after you've already chosen one, and to enforce "one question at a time" strictly.

### Fix 4: Upgrade to a faster, smarter model
Switch from `gemini-2.5-flash-lite` to `gemini-2.5-flash` for phone calls. This model is still fast but significantly better at following instructions, meaning it will respond within 3 seconds more often and understand context better.

## Technical Details

All changes are in one file: `supabase/functions/voice-handler/index.ts`

### Change 1: AbortController in handleProcess (lines 544-584)
- Create an AbortController BEFORE the race
- When the 3-second timer wins, call `controller.abort()` to kill the original AI fetch
- Only the background call will produce a response

### Change 2: Remove "CONVERSATION SO FAR" from buildPhoneSystemPrompt (lines 93-99)
- Delete lines 93-99 that embed conversation history in the system prompt
- Add new strict rules:
  - "Once the caller mentions a service, do NOT list services again. Ask for their name immediately."
  - "NEVER say 'What else can I help you with?' during a booking flow."
  - "Each response must contain exactly ONE question."

### Change 3: Upgrade model (lines 536 and 848)
- Change `google/gemini-2.5-flash-lite` to `google/gemini-2.5-flash` in both `handleProcess` and `handleProcessBackground`

## Expected Improvement

| Issue | Before | After |
|-------|--------|-------|
| Response time | Regularly exceeds 3s, triggers hold loop | Faster model hits deadline more often |
| Duplicate responses | Two AI calls compete | Original is cancelled, only one survives |
| Repeating services | AI sees history twice, loops back | Single clean history, strict flow rules |
| Ignoring caller input | Confused by duplicate context | Clear context, better model comprehension |

## No database changes needed
All changes are within the voice-handler edge function code only.

