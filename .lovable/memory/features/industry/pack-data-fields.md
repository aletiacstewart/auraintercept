---
name: Industry Pack Data Fields
description: Storage convention and renderer contract for per-industry intake forms driven by industry_template_packs.form_schemas
type: feature
---

# Industry Pack Data Fields

Industry-specific intake questions are defined per-vertical in
`public.industry_template_packs.form_schemas` as a JSONB map of
`{ <form_id>: { fields: IntakeFieldDef[] } }`.

Each job template (`job_templates[].form_id`) references one of these schema
entries. When a user selects a job template in the booking flow,
`resolveFormSchema(pack, serviceSelection)` returns the matching schema and
`<DynamicIntakeFields>` renders the questions inline.

## Storage

- `appointments.intake_data jsonb not null default '{}'::jsonb`
- `leads.intake_data jsonb not null default '{}'::jsonb`

Always upsert the full intake object. Never spread mid-flight changes into
other top-level appointment columns. Aura reads `intake_data` directly when
building per-row context for triage / follow-up.

## Field types supported by `DynamicIntakeFields`

`text | textarea | number | select | date | checkbox`. Anything else falls
back to `text`. `required` is enforced at submit via `validateIntake`.

## When intake renders

Only when:
1. The current company has an industry pack with a matching `job_templates`
   entry that defines `form_id`, AND
2. That `form_id` exists in `form_schemas` with at least one field.

Otherwise the renderer returns `null` so generic verticals see the legacy
booking form unchanged.

## Files

- `src/lib/industryFormSchemas.ts` — types + `resolveFormSchema`,
  `validateIntake`, `summarizeIntake`, `getJobTemplate`.
- `src/components/forms/DynamicIntakeFields.tsx` — controlled renderer.
- `src/components/appointments/AddAppointmentForm.tsx` — wired.

## Known gap

`LeadForm` currently writes to `campaign_recipients`, not `leads`, so the
`leads.intake_data` column added in Phase C is not yet populated from the UI.
Wire intake into whichever path actually creates `leads` rows when that flow
is added.