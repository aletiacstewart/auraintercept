

# Fix Natural Language Date Understanding in ElevenLabs Voice Agent

## Problem

When users say dates like "tomorrow at 4pm" or "Wednesday next week", the ElevenLabs agent asks for the date in MM/DD/YY format instead of understanding natural language.

**Root Cause**: The current system prompt and tool parameter descriptions don't instruct the ElevenLabs AI to interpret and convert natural language dates. The AI passes the raw text to the webhook, but it's better to have the AI understand the date context upfront.

## Solution

Update both the **system prompt** and the **parameter descriptions** in the ElevenLabs setup guide to:
1. Instruct the AI that it should understand natural language dates
2. Provide explicit examples of date formats to accept
3. Add date conversion guidance in the prompt

## Changes Required

### File: `src/components/integrations/ElevenLabsSetupGuide.tsx`

**1. Update the Agent Prompt (AGENT_PROMPT constant)**

Add clear instructions for handling natural language dates:

```
IMPORTANT DATE HANDLING:
- Understand natural language dates like "tomorrow", "next Monday", "Wednesday of next week", "in 3 days"
- Convert these to proper dates before calling tools
- Today's date context: Use your knowledge of the current date to calculate relative dates
- If unclear, ask for clarification (e.g., "Did you mean this Wednesday or next Wednesday?")
- For get_available_times and book_appointment, convert to YYYY-MM-DD format

EXAMPLES:
- "tomorrow at 4pm" -> date: tomorrow's date in YYYY-MM-DD, time: 16:00
- "next Tuesday" -> calculate the date for next Tuesday
- "this Friday afternoon" -> that Friday's date, then ask about specific time
```

**2. Update Parameter Descriptions**

For the `date` parameter in `get_available_times` and `book_appointment`, update the LLM prompt descriptions:

Current:
```
description: 'Date in YYYY-MM-DD format chosen by customer'
description: 'Appointment date (YYYY-MM-DD)'
```

Change to:
```
description: 'The appointment date. Convert natural language (tomorrow, next Monday, etc.) to YYYY-MM-DD format based on current date'
description: 'Appointment date converted to YYYY-MM-DD. Interpret natural language like tomorrow, next week, Wednesday, etc.'
```

**3. Update Time Parameter Description**

For the `time` parameter in `book_appointment`:

Current:
```
description: 'Appointment time (HH:MM)'
```

Change to:
```
description: 'Appointment time in HH:MM format (24hr). Convert "4pm" to 16:00, "9am" to 09:00, etc.'
```

## Why This Works

ElevenLabs uses the parameter descriptions as prompts to the LLM when extracting values from conversation. By:
1. Explicitly telling the AI it can understand natural dates
2. Providing conversion instructions in the description
3. Adding examples in the system prompt

The AI will interpret "tomorrow at 4pm" and extract:
- `date`: `2026-01-30` (correctly calculated)
- `time`: `16:00` (correctly converted)

## Additional Enhancement

The edge function (`voice-booking-agent`) already has fallback date parsing (lines 167-187), but this update ensures the AI does the conversion upfront for a smoother experience.

---

## Summary

| Change | Location | Purpose |
|--------|----------|---------|
| Update AGENT_PROMPT | Lines 88-101 | Add natural language date handling instructions |
| Update `date` description | Lines 64, 81 | Tell AI to convert dates to YYYY-MM-DD |
| Update `time` description | Line 82 | Tell AI to convert times to HH:MM |

