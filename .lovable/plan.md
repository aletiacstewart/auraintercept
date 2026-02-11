

## Fix: Ensure Voice Booking Agent Works for All Companies

### Problem
The voice booking tools (get_services, check_availability, create_appointment) are configured correctly in the ElevenLabs dashboard as Client tools, but there are reliability issues preventing them from working consistently across all companies.

### Root Causes

1. **companyId fallback bug in the edge function**: When the `agentId` lookup fails (e.g., agent not in `tenant_integrations`), the fallback on line 57 of `voice-booking-agent/index.ts` checks `toolParams.company_id` (snake_case), but VoiceChat.tsx sends `companyId` (camelCase). This means the fallback silently fails and returns "Could not determine company."

2. **No companyId sent directly**: The `invokeBookingAgent` helper sends `companyId` as a top-level body parameter, but the edge function extracts `toolParams` from `body.parameters || body.tool_parameters || body`. Since there's no `parameters` key, `toolParams` becomes the entire `body` object -- so `toolParams.companyId` exists but the code only checks `toolParams.company_id`.

3. **Single agent shared across companies**: Only one ElevenLabs agent exists (agent_0501kh...), but the VoiceChat component fetches the `elevenlabs_agent_id` per company. Companies without an agent configured in `tenant_integrations` will show "Voice agent not configured" and never connect.

### Solution

**File: `supabase/functions/voice-booking-agent/index.ts`**

1. Fix the companyId extraction to check both camelCase and snake_case variants:
   - Line 38: Also check `body.companyId`
   - Line 57: Check both `toolParams.company_id` and `toolParams.companyId`

2. Add a direct `body.companyId` check before the `toolParams` fallback (since VoiceChat sends it as a top-level param alongside `toolName`):
   ```
   // After agentId lookup fails, check direct body params
   if (!companyId) {
     companyId = (body.companyId || body.company_id || toolParams.companyId || toolParams.company_id || "") as string;
   }
   ```

3. Add better logging so failed tool calls are visible in edge function logs.

### Technical Details

The fix is small but critical -- a single snake_case vs camelCase mismatch in the edge function prevents the company from being resolved when the agentId-based lookup doesn't return a result. This one-line class of bug silently returns a 400 error ("Could not determine company") that the clientTool swallows and returns as a generic error to the ElevenLabs agent.

### Files to Modify
- `supabase/functions/voice-booking-agent/index.ts` -- Fix companyId resolution to handle both camelCase and snake_case
