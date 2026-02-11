

## Fix: Contextual Fillers, No Re-Asking, and SWAIG Fallback Messages

### Changes

**1. `supabase/functions/voice-handler/index.ts`**

- **Keep `speech_fillers`** but add a prompt instruction telling the AI to only use fillers when actively thinking or processing, not after every sentence. Add to the system prompt:
  - "Use filler words like 'um' or 'uh' sparingly and only when you are genuinely pausing to think or look something up. Never use them as a habit after every response."
- **Add no-repeat rule** to the prompt:
  - "NEVER re-ask for information the caller has already provided. If you collected their name, phone, or email earlier, use it."
  - "Do NOT ask 'would you like to leave your contact info' if you already have it from earlier in the conversation."

**2. `supabase/functions/voice-swaig/index.ts`**

- **Line 96**: Change "Would you like to leave your information and we'll call you back?" to "Would you like me to have a team member reach out to you?"
- **Line 200**: Change "Would you like to leave your information and we'll reach out when something opens up?" to "I can have a team member reach out when something opens up. Would you like that?"

These changes prevent the SWAIG responses from triggering the AI to re-collect info it already has.

**3. `supabase/functions/voice-booking-agent/index.ts`**

- Add a `get_services` / `list_services` tool handler so the ElevenLabs web voice agent can look up company services (mirroring what `voice-swaig` already does for phone calls).

### Technical Summary

| File | What Changes |
|------|-------------|
| `voice-handler/index.ts` | Add prompt lines for contextual filler usage and no-repeat info gathering |
| `voice-swaig/index.ts` | Update 2 fallback messages to stop triggering re-collection of caller info |
| `voice-booking-agent/index.ts` | Add `get_services` tool handler for web voice chat |

