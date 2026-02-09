
## Make All Call and SMS Scripts Configurable Per Company

Currently, the AI Agent Settings page only has two configurable text fields: **Voice Greeting** (for inbound calls) and **AI Agent Personality/Prompt**. All other outbound call and SMS messages are hardcoded in the backend functions. This plan adds configurable script templates for every outbound scenario.

### What Changes

**1. Database: Add new columns to `companies` table**

Add these template columns:
- `missed_call_sms_template` (text) -- SMS sent when a call is missed
- `missed_call_callback_script` (text) -- Voice script for return calls after a missed call
- `reminder_call_script` (text) -- Voice script for appointment reminder calls
- `followup_call_script` (text) -- Voice script for post-service follow-up calls
- `default_outbound_script` (text) -- Fallback voice script for generic outbound calls

Each column will have a sensible default value (NULL, falling back to hardcoded defaults in the functions).

**2. Dashboard UI: Expand AIAgentSettings.tsx**

Add a new card section called **"Call & SMS Scripts"** below the existing AI Agent Behavior card. It will contain:

- **Missed Call SMS** -- textarea with placeholder tokens like `{companyName}`
- **Missed Call Callback Script** -- textarea for what the AI says when returning a missed call
- **Appointment Reminder Script** -- textarea with tokens `{customerName}`, `{service}`, `{dateTime}`, `{employeeName}`
- **Follow-up Call Script** -- textarea with token `{customerName}`
- **Default Outbound Script** -- textarea with token `{customerName}`

Each field shows a preview of available placeholder tokens below it. All fields save alongside the existing settings using the same Save button.

**3. Backend Functions: Read templates from database instead of hardcoding**

- **`missed-call-handler/index.ts`**: Already fetches `company.name` -- will also fetch the new template columns. Replace the hardcoded SMS body and callback message with the company's templates, substituting `{companyName}` at runtime.

- **`outbound-call/index.ts`**: Already fetches company data -- will read the new script columns and use them based on `purpose` (reminder, followup, custom, missed_call_callback). Token substitution for `{customerName}`, `{service}`, `{dateTime}`, `{employeeName}`.

- **`test-voice-reminder/index.ts`**: Will use the company's `reminder_call_script` template if set.

### Placeholder Tokens

Scripts support these tokens that get replaced at runtime:
- `{companyName}` -- Company name
- `{customerName}` -- Customer's name
- `{service}` -- Service/appointment type
- `{dateTime}` -- Formatted appointment date/time
- `{employeeName}` -- Assigned technician/employee name

### Technical Details

**Database migration** adds 5 nullable text columns to the `companies` table.

**AIAgentSettings.tsx** changes:
- Query expands to fetch the 5 new columns
- 5 new `useState` hooks for the template values
- Save mutation updates all columns at once
- New "Call & SMS Scripts" card with textareas and token documentation

**Edge function changes** (3 files):
- Each function fetches the relevant template column from `companies`
- A shared `replaceTokens(template, vars)` helper substitutes `{tokenName}` patterns
- Falls back to current hardcoded text if the column is empty/null

### Files Modified
- Database migration (5 new columns on `companies`)
- `src/components/ai/AIAgentSettings.tsx` -- new scripts card UI
- `supabase/functions/missed-call-handler/index.ts` -- use templates
- `supabase/functions/outbound-call/index.ts` -- use templates
- `supabase/functions/test-voice-reminder/index.ts` -- use templates
