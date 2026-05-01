# Phase C — Dynamic Industry Intake Forms

Goal: when a user creates an appointment (or lead), the form auto-renders the industry-specific questions defined in `industry_template_packs.form_schemas` for the selected job template — so Real Estate captures MLS#, Salons capture allergies, HVAC captures system age, etc. — instead of every vertical seeing the same generic form.

## Scope

In scope:
1. New JSONB storage column on `appointments` (and `leads`) for intake answers.
2. A reusable `<DynamicIntakeFields>` renderer driven by a `form_schemas` entry.
3. Wire it into `AddAppointmentForm` and `LeadForm` so the right fields appear when an industry job template is selected.
4. Display captured intake data on the appointment/lead detail views (read-only summary).
5. Pass intake data into the AI agent context so Aura can reference it during follow-up.

Out of scope (later phase): customer-facing public booking widget rendering (will reuse the same renderer once verified internally), KB document seeding, conditional/branching fields.

## Schema shape recap

Each pack stores `form_schemas` as:

```text
{
  "<form_id>": {
    "fields": [
      { "name": "mls_number", "label": "MLS #", "type": "text", "required": false },
      { "name": "buyer_pre_approved", "label": "Pre-approved?", "type": "select",
        "options": ["Yes","No","Cash"] }
    ]
  }
}
```

Job templates reference a `form_id`, e.g. `{ id: "showing", label: "Buyer Showing", form_id: "showing_intake", duration_minutes: 45 }`. Supported field types: `text`, `number`, `select`, `textarea`, `date`, `checkbox`.

## Database changes (migration)

- `appointments`: add `intake_data jsonb not null default '{}'::jsonb`.
- `leads`: add `intake_data jsonb not null default '{}'::jsonb`.
- No RLS changes needed — existing row-level policies cover the new column.

## New files

- `src/components/forms/DynamicIntakeFields.tsx` — renders fields from a schema entry, controlled component:
  - props: `schema: { fields: FieldDef[] } | null`, `value: Record<string, unknown>`, `onChange(next)`, `disabled?`.
  - returns `null` if schema is empty, so generic verticals see no extra UI.
  - uses existing shadcn `Input`, `Textarea`, `Select`, `Checkbox`, `Calendar`/`Popover` primitives.
  - validation: enforces `required` on submit via a `validateIntake(schema, value)` helper exported from the same file.
- `src/lib/industryFormSchemas.ts` — small helpers:
  - `resolveFormSchema(pack, serviceSelection)` — given a selected service value (which may be `pack:<jobTemplateId>` or a real DB service), returns the matching `form_schemas[form_id]` or `null`.
  - `getJobTemplate(pack, id)` lookup.
  - Shared `IntakeFieldDef` / `IntakeFormSchema` TypeScript types.

## Edited files

- `src/components/appointments/AddAppointmentForm.tsx`
  - Add `intakeData` state (`Record<string, unknown>`).
  - Use `resolveFormSchema(pack, selectedService)` to derive the active schema; render `<DynamicIntakeFields>` below the Service Type field.
  - On submit, run `validateIntake`; include `intake_data: intakeData` in the insert payload.
  - When the user switches services, reset `intakeData` to `{}`.
- `src/components/marketing/forms/LeadForm.tsx`
  - Same pattern. Lead intake forms are picked from a configurable default key (`pack.form_schemas.lead_intake` if present, else first defined schema). Falls back to no extra fields for generic.
- `src/components/appointments/AppointmentsManager.tsx` (detail view section)
  - Render a small "Intake details" summary list (label: value) when `appointment.intake_data` has keys.
- `src/pages/Leads.tsx` lead detail panel — same read-only summary.
- `src/hooks/useIndustryPack.ts` — tighten `form_schemas` typing to `Record<string, IntakeFormSchema>` (exported from `industryFormSchemas.ts`).

## AI context wiring

- `supabase/functions/aura-unified/index.ts` — when fetching an appointment/lead for context, include `intake_data` in the serialized snapshot the model sees, prefixed with `Intake details:` so Aura can answer "is the buyer pre-approved?" without the user re-typing it.
- No prompt-template changes elsewhere; existing per-industry `agent_prompt_deltas` already nudge the agent to use these fields.

## QA

1. Switch demo company to Real Estate → New Appointment → pick "Buyer Showing" → confirm MLS#, Pre-approved, Timeline, Working-with-agent fields render. Save. Reopen — intake summary visible.
2. Switch to HVAC → "No Cooling – Emergency" should show system age / unit type / symptom fields.
3. Switch to a generic / unset industry → no extra fields render, form behaves exactly as today.
4. Required-field validation blocks submit with a toast.
5. Existing appointments (no `intake_data`) load fine (default `{}`).

## Memory updates

- Update `mem://features/industry/pack-data-fields.md` with the `intake_data` storage convention and the new `DynamicIntakeFields` component contract.
- Add a Core line: "Industry intake fields render from `form_schemas[job.form_id]` and persist to `appointments.intake_data` / `leads.intake_data` JSONB."

After approval I'll run the migration, add the renderer, wire both forms, surface intake on detail views, and extend the Aura context payload.
