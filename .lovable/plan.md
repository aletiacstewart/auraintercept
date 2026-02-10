

# Fix Voice Agent "Not Waiting" for Name/Contact Info

## Problem

The voice agent prompts in both `AuraIntelligenceSettings.tsx` and `ElevenLabsSetupGuide.tsx` currently have a single step that says:

> "3. Collect: name, phone, address - give ample time for EACH answer"

AI voice models interpret this as a single conversational turn -- they ask for all three at once ("Can I get your name, phone number, and address?") instead of asking one at a time and waiting. The "give ample time" instruction is too vague for the model to follow reliably.

## Solution

### 1. Update the Booking Flow in both prompts to enforce one-field-at-a-time collection

Replace the single "Collect: name, phone, address" step with explicit sequential steps and add a strict rule about never asking for multiple fields at once.

**Before (both files):**
```
3. Collect: name, phone, address - give ample time for EACH answer
```

**After:**
```
3. Ask: "Can I get your full name?" — WAIT for their complete answer before continuing
4. Ask: "And a good phone number to reach you?" — WAIT for the full number
5. Ask: "What's the address for the service?" — WAIT for complete address
```

Plus add a new rule in the GUIDELINES / CONVERSATIONAL PAUSES section:
```
- NEVER ask for multiple pieces of information in one question (e.g., don't say "Can I get your name, phone, and address?")
- Ask for ONE piece of info at a time, wait for the answer, then ask for the next
```

### 2. Update the ElevenLabs Setup Guide timing recommendations

In `ElevenLabsSetupGuide.tsx`, update the recommended End of Speech Detection value from "2000-4000ms" to a tighter recommendation of **4000ms**, and add a troubleshooting note about the "agent not waiting" issue.

### 3. Update the ElevenLabsVoiceSetupGuide.tsx (basic guide)

Add a new step or tip in the "Create Conversational Agent" section about configuring End of Speech Detection to 4000ms and Interruption Sensitivity to Low, since this is the most common issue users face.

## Files to Modify

1. **`src/components/settings/AuraIntelligenceSettings.tsx`** -- Update the `generateElevenLabsPrompt()` function's BOOKING FLOW and CONVERSATIONAL PAUSES sections
2. **`src/components/integrations/ElevenLabsSetupGuide.tsx`** -- Update the `AGENT_PROMPT` constant's FLOW and CONVERSATIONAL PAUSES sections, plus update the timing recommendation from "2000-4000ms" to "4000ms"
3. **`src/components/integrations/ElevenLabsVoiceSetupGuide.tsx`** -- Add a tip in the Conversational Agent step about timing settings

## No database changes, no new dependencies, no breaking changes

The changes are prompt text and guide content only. Users who have already copied the old prompt will need to re-copy the updated version.
