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

## AI integration (Phase D)

- `ai-agent-chat` injects an `INDUSTRY INTAKE FIELDS` section into the system
  prompt for the booking-capable agents, enumerating `(label, name, required)`
  per `job_templates[].form_id`. The agent collects the values
  conversationally and passes them via `create_appointment.intake_data`
  (object). Persisted on the appointments row.
- `voice-booking-agent` accepts `intake_data` (object or JSON string) on
  `create_appointment` / `book_appointment` and persists it.
- Public unauthenticated booking widgets read the schema via the
  `get_public_industry_pack(p_company_id uuid)` RPC, which returns
  `industry_id, label, job_templates, form_schemas, terminology` only — no
  prompt deltas or tier gating data.

## Files

- `src/lib/industryFormSchemas.ts` — types + `resolveFormSchema`,
  `validateIntake`, `summarizeIntake`, `getJobTemplate`.
- `src/components/forms/DynamicIntakeFields.tsx` — controlled renderer.
- `src/components/appointments/AddAppointmentForm.tsx` — wired.
- `src/components/ai/BookingForm.tsx` — wired. Accepts `companyId` +
  `isPublic`. Resolves intake schema from the FIRST selected service via
  `useIndustryPack` (auth) or `usePublicIndustryPack` (unauth RPC) and
  blocks submit on missing required intake fields. Returns
  `BookingData.intakeData`.
- `src/hooks/useIndustryPack.ts` — exports `usePublicIndustryPack` for
  unauthenticated widgets calling `get_public_industry_pack`.

## Known gap

`LeadForm` currently writes to `campaign_recipients`, not `leads`, so the
`leads.intake_data` column added in Phase C is not yet populated from the UI.
Wire intake into whichever path actually creates `leads` rows when that flow
is added.