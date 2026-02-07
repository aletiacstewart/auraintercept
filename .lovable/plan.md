
# Fix AI Voice Agent Issues

## Problems Identified

### 1. Agent Doesn't Pause Long Enough
The ElevenLabs Conversational AI agent's response timing is controlled by settings in the **ElevenLabs Dashboard**, not in your code. The current setup guide doesn't mention configuring these critical settings:
- **End of Speech Detection** - How long the AI waits after you stop talking
- **Responsiveness** - How quickly the agent responds

### 2. Agent Asks for Rigid Date Formats (mm/dd/yyyy)
The current system prompt instructs the AI to understand natural language dates, but the instructions aren't prominent enough. The agent is still sometimes asking for explicit date formats instead of intuitively understanding "next Monday at 2pm" or "this Thursday".

### 3. Agent Not Using Company-Specific Settings
Your Aura Intelligence configuration (brand tone, emergency settings, etc.) exists in the database but is **not being pulled into the ElevenLabs agent prompt**. The setup guide provides a generic static prompt rather than company-customized instructions.

---

## Solution Overview

### Part 1: Update ElevenLabs Setup Guide with Conversation Settings

Add a new section in the setup guide explaining how to configure:
- **End of Speech Detection**: Set to "Relaxed" (~3-4 seconds) for collecting information like names/numbers
- **Response Delay**: Add a brief delay to ensure users finish speaking
- **Turn-Taking Sensitivity**: Reduce interruption behavior

### Part 2: Improve the Agent Prompt with Stronger Date/Time Instructions

Update the recommended agent prompt to:
- **Explicitly forbid** asking for formatted dates
- Add more examples of natural language date interpretation
- Include a pause-and-wait instruction for collecting names/numbers

### Part 3: Add Company-Specific Prompt Export

Create a new feature in the Aura Intelligence settings that generates a **complete, company-customized prompt** users can copy into ElevenLabs, including:
- Company name and brand tone
- Service area ZIP codes
- Emergency protocols
- Smart link URLs
- Business hours

---

## Technical Changes

### File 1: `src/components/integrations/ElevenLabsSetupGuide.tsx`

**Add new section (after Step 2)**: "Configure Conversation Settings"

```text
New content to add:

📍 Location: Agent Settings → Advanced → Conversation Settings

Configure these critical settings for natural conversation:

1. **End of Speech Detection**: Set to "Relaxed" (2000-4000ms)
   - Gives callers more time to provide names, phone numbers, and addresses
   - Prevents the agent from cutting off mid-sentence

2. **Response Speed**: Set to "Normal" or "Relaxed"
   - Ensures the agent doesn't interrupt while collecting information

3. **Interruption Sensitivity**: Set to "Low"
   - Prevents the AI from cutting in when the caller pauses to think

These settings are critical for collecting customer information without rushing them.
```

**Update the AGENT_PROMPT constant** to include stronger date handling:

```typescript
const AGENT_PROMPT = `You are a professional and friendly appointment booking assistant. Help customers schedule service appointments.

CRITICAL - CONVERSATIONAL PAUSES:
- When asking for name, phone, or address, WAIT patiently for the response
- Never rush the caller - give them time to speak
- Say "take your time" if they seem to be thinking

CRITICAL - DATE & TIME HANDLING:
- NEVER ask for dates in a specific format like "mm/dd/yyyy" or "month day year"
- ALWAYS accept natural language: "tomorrow", "next Monday", "this Friday", "in 2 days"
- Examples you must understand:
  • "tomorrow at 4pm" → Calculate tomorrow's date
  • "next Tuesday around 3" → Next week's Tuesday, 15:00
  • "this Thursday afternoon" → This week's Thursday, ask for specific time
  • "in 3 days at 10am" → Calculate the date
  • "Monday the week after next" → Calculate correctly
- If ambiguous, ask for clarification naturally: "Did you mean this coming Monday or the Monday after?"
- Convert times naturally: "4pm" = 16:00, "9 in the morning" = 09:00

FLOW:
1. Greet warmly, ask how you can help
2. Ask what service they need (call get_services first)
3. Collect: name, phone, address - give time for each answer
4. Ask "What day works best for you?" - accept natural language
5. Confirm date, then check times (get_available_times)
6. Confirm all details before booking

GUIDELINES:
- Be conversational and patient
- Never ask for specific date formats
- If no times available, offer alternatives`;
```

### File 2: `src/components/settings/AuraIntelligenceSettings.tsx`

**Add new export button**: "Export ElevenLabs Prompt"

This generates a complete, company-customized prompt including:
- Company name
- Brand tone instructions
- Service ZIP codes
- Emergency keywords and protocols
- Business hours (fetched from business_hours table)
- Smart links

The generated prompt will look like:

```text
You are Aura, the AI voice assistant for [Company Name]. 

PERSONALITY:
- Use a [professional/friendly/technical] tone
- Be patient when collecting customer information
- Never rush callers

CRITICAL - DATE HANDLING:
- Accept natural language dates: "tomorrow", "next Monday", "this Friday"
- NEVER ask for mm/dd/yyyy format
- Convert relative dates based on today's date

COMPANY CONTEXT:
- Business Name: [Company Name]
- Phone: [contact_phone]
- Service Area: [zip_codes]
- Emergency Surcharge: $[amount] for after-hours

EMERGENCY PROTOCOL:
If caller mentions: [gas, fire, smoke, flood, etc.]
→ Immediately provide emergency number: [emergency_phone]
→ Do not proceed with booking

BOOKING LINKS:
- Booking: [url]
- Payment: [url]
- Reviews: [url]

[Include business hours]
[Include services list]
```

---

## Summary of Changes

| File | Change |
|------|--------|
| `ElevenLabsSetupGuide.tsx` | Add "Conversation Settings" section explaining pause/timing config in ElevenLabs dashboard |
| `ElevenLabsSetupGuide.tsx` | Update AGENT_PROMPT with stronger natural language date instructions |
| `ElevenLabsSetupGuide.tsx` | Add warning about collection pauses |
| `AuraIntelligenceSettings.tsx` | Add "Export ElevenLabs Prompt" button that generates company-specific prompt |

---

## User Action Required (ElevenLabs Dashboard)

After the code changes, you'll need to:

1. Go to ElevenLabs Dashboard → Your Agent → Settings
2. Find **Conversation Settings** or **Advanced Settings**
3. Set **End of Speech Detection** to "Relaxed" (2000-4000ms)
4. Set **Interruption Sensitivity** to "Low"
5. Copy the new prompt from Aura Intelligence settings
6. Paste into your agent's System Prompt
