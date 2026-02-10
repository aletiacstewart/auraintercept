

# Fix: SWML AI Agent — Prompt, Knowledge, Terminology, and Speech Timing

## Problems Identified

1. **Generic prompt, not Aura Intercept**: The `buildSWMLDocument` only reads `companies.ai_agent_prompt` but does NOT inject the company's services list or knowledge base content. The AI has no context about what Aura Intercept actually does.

2. **"Technician" spoken to callers**: In `voice-swaig.ts` line 91, the fallback message says "we don't have any technicians available." The internal `job_type` must stay as `technician` (per architecture standard), but the caller-facing language must say "agent" or "team member" instead.

3. **No services loaded**: The SWML prompt doesn't fetch the `services` table. Aura Intercept has one service ("Aura Intercept Consultation, 45 min") but the AI doesn't know about it, so it can't guide the caller.

4. **Knowledge base not connected**: There are 9 knowledge documents uploaded (PDFs like pricing, FAQ, user guide) but their `content_text` is all NULL — meaning the text was never extracted. Even if it were extracted, the SWML prompt doesn't include it. For now, we'll inject the services and company context; knowledge base PDF extraction is a separate task.

5. **Speech cut-off — `end_of_speech_timeout` too short**: Currently set to 1400ms (1.4 seconds). When a caller pauses briefly while saying their name or email, the AI thinks they're done and jumps in. This needs to be increased to ~3000ms (3 seconds) so callers have time to finish speaking.

6. **`attention_timeout` too short**: Set to 15 seconds. If the caller takes more than 15 seconds to respond, the AI prompts them. This should be increased to ~25 seconds to give callers time to think (especially for email/phone dictation).

## Changes

### 1. Update `supabase/functions/voice-handler/index.ts`

**In `buildSWMLDocument()`:**
- Accept a new `services` parameter (array of service objects)
- Inject service names, descriptions, and durations into the system prompt so the AI knows what the company offers
- Change `end_of_speech_timeout` from 1400 to 3000
- Change `attention_timeout` from 15000 to 25000
- Add service names to the `hints` array so SignalWire's speech recognition is primed for them

**In `handleIncoming()`:**
- After fetching the company, also query the `services` table for active services belonging to that company
- Pass the services array into `buildSWMLDocument()`

**In `buildPhoneSystemPrompt()`:**
- Append a "SERVICES OFFERED" section listing each service with name, description, and duration
- Replace any mention of "technician" with "team member" in the prompt text

### 2. Update `supabase/functions/voice-swaig/index.ts`

**In `handleCheckAvailability()`:**
- Change line 91 from "we don't have any technicians available" to "we don't have any team members available right now"
- Use the service's `duration_minutes` from the `services` table instead of hardcoded 60-minute slots when generating availability

**In `handleBookAppointment()`:**
- Look up the service by name from the `services` table to get the correct `duration_minutes` (currently hardcoded to 60; Aura Intercept Consultation is 45 min)
- Use that duration when creating the appointment

**Add a new SWAIG function `get_services`:**
- Returns the list of available services so the AI can tell the caller what's offered
- This matches the pattern from the existing `widget-api` and `booking-actions` functions

### 3. Update SWAIG function definitions in `buildSWMLDocument()`

Add a `get_services` function definition to the SWAIG functions array so the AI can call it when asked "what services do you offer?"

## No Database Changes

All fixes are edge function code only.

## Expected Results

| Issue | Before | After |
|-------|--------|-------|
| Prompt context | Generic "helpful assistant" | Includes Aura Intercept services and company details |
| Terminology | "technicians" spoken to callers | "team members" or "agents" |
| Services awareness | AI doesn't know what's offered | AI lists services with descriptions and durations |
| Speech cut-off | 1.4s pause = AI interrupts | 3s pause tolerance, callers can finish speaking |
| Appointment duration | Always 60 min | Uses actual service duration (45 min for consultation) |

