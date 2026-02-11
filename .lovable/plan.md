
## Update: ElevenLabs Setup Guide for Client-Side Tools

### Root Cause
The ElevenLabs setup guide in `src/components/integrations/ElevenLabsSetupGuide.tsx` still instructs users to create server-side webhook tools with the old naming scheme:
- `get_services`
- `get_available_dates` 
- `get_available_times`
- `book_appointment`

However, the VoiceChat component was just updated to use **client-side tool interception** via `clientTools`, which means:
1. Tools should be configured as **"client" tools** (not "webhook" tools) in the ElevenLabs dashboard
2. The tool names must match exactly: `get_services`, `check_availability`, `create_appointment` (3 tools instead of 4)
3. The execution path is now browser-based, not server-side webhook

### Solution

Update the ElevenLabsSetupGuide component to:

1. **Change Step 3 instructions** to clarify that tools must be **"client" tools** (not webhook tools)
2. **Simplify the tool list** from 4 tools to 3 client tools:
   - `get_services` - Get available services
   - `check_availability` - Check availability for a date and service
   - `create_appointment` - Create a booking
3. **Remove deprecated tools** from the config:
   - Remove `get_available_dates`
   - Remove `get_available_times`
   - Merge their functionality into the new 3-tool model
4. **Update descriptions and parameter guidance** to reflect client-side execution
5. **Add a critical note** explaining that these are client tools that run in the browser, not server webhooks
6. **Update tool body parameters** to match what the `voice-booking-agent` edge function expects when called via `supabase.functions.invoke()`

### Technical Changes

**File: `src/components/integrations/ElevenLabsSetupGuide.tsx`**

1. Update `getToolConfigs()` function to define only 3 tools: `get_services`, `check_availability`, `create_appointment`
2. Modify tool descriptions to clarify these are client tools
3. Update Step 3 title/description to emphasize "Client Tools" instead of "Webhook Tools"
4. Add a prominent alert explaining that tools must be marked as "client" tools in ElevenLabs dashboard, not server/webhook tools
5. Remove references to "Form Mode" vs "JSON Mode" since client tools work differently
6. Update the webhook URL section to note that for client tools, this URL is not needed (the browser calls the edge function directly)

### Implementation Notes

- Client tools in ElevenLabs SDK are configured in `clientTools` object in the hook, not in the ElevenLabs dashboard agent config
- The guide should clarify the 3 tools and their purposes clearly
- Parameter mapping should be simplified since client-side tools receive parameters directly from the ElevenLabs agent
- Users may already have the old 4-tool webhook setup configured — they should replace it with the new 3-tool client setup

### Key Updates Summary

| Old Setup (Server Webhook) | New Setup (Client Tools) |
|---|---|
| 4 tools: get_services, get_available_dates, get_available_times, book_appointment | 3 tools: get_services, check_availability, create_appointment |
| Tools configured in ElevenLabs agent dashboard → Tools → Webhook | Tools auto-configured by browser SDK in `clientTools` |
| Execution: ElevenLabs → Server Webhook → edge function | Execution: ElevenLabs Agent → Browser clientTools → edge function |
| Webhook URL required | No webhook needed |
| Server-side, can fail silently if ElevenLabs can't reach endpoint | Browser-based, reliable client-side execution |

