

## Add AI Generation and Templates to Call & SMS Scripts

### Overview
Each script field in the "Call & SMS Scripts" section will get:
1. An **AI Generate** button (sparkle icon) next to the label -- reuses the existing `AIContentButton` component for "Generate New" and "Reword/Improve"
2. A **Templates dropdown** with 2-3 pre-written industry templates per script type that populate the field with one click

### Changes

**1. Edge Function: `supabase/functions/generate-website-content/index.ts`**
- Add 5 new content type prompts to `CONTENT_PROMPTS`:
  - `missed_call_sms` -- generates a friendly missed-call SMS
  - `missed_call_callback` -- generates a return-call voice script
  - `reminder_call` -- generates an appointment reminder script with token placeholders
  - `followup_call` -- generates a post-service follow-up script
  - `default_outbound` -- generates a general outbound call script
- Each prompt instructs the AI to include the appropriate `{token}` placeholders in the output

**2. AIContentButton content types**
- Add the 5 new types to the `ContentType` union in `AIContentButton.tsx`

**3. Frontend: `src/components/ai/AIAgentSettings.tsx`**
- Add a new `ScriptTemplates` inline component (or simple dropdown) per script field offering 2-3 ready-made templates (e.g., "Professional", "Friendly", "Urgent")
- Place the `AIContentButton` next to each script label, passing the current textarea value and an `onGenerate` callback that updates state
- Template data will be defined as a constant map within the file

### Template Examples

**Missed Call SMS templates:**
- Professional: "We missed your call at {companyName}. Reply here or call us back and we'll be happy to assist."
- Friendly: "Hey! We saw we missed your call at {companyName}. Text us back or give us a ring -- we're here to help!"

**Appointment Reminder templates:**
- Standard: "Hi {customerName}, this is {companyName} reminding you about your {service} appointment on {dateTime} with {employeeName}. Press 1 to confirm or 2 to reschedule."
- Brief: "Hi {customerName}, reminder: {service} on {dateTime}. Press 1 to confirm, 2 to reschedule."

Similar pattern for the other 3 script types.

### Technical Details

**Files modified:**
- `src/components/ai/AIContentButton.tsx` -- add 5 new content types to the union
- `supabase/functions/generate-website-content/index.ts` -- add 5 new prompt entries
- `src/components/ai/AIAgentSettings.tsx` -- add AIContentButton + template dropdown to each script field

**UI layout per script field:**
```text
[Label] ........................ [Template dropdown] [AI sparkle button]
[Textarea                                                              ]
[Token hints                                                           ]
```

The template dropdown uses the existing `Select` component. Selecting a template populates the textarea. The AI button uses the existing `AIContentButton` with generate/reword actions.
