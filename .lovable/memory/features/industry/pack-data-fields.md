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

## Reporting (Phase F)

`intake_data` powers a dedicated **Intake** tab in `Analytics.tsx` via
`src/components/analytics/IntakeAnalytics.tsx`. The picker is driven by
`src/lib/intakeAnalytics.ts#getReportableIntakeFields(pack)` which dedupes
across `form_schemas[*].fields[*]` (skipping `textarea`).

Three SECURITY DEFINER RPCs back the views — all scoped to
`get_user_company_id(auth.uid())`, full scope for `platform_admin`:

- `intake_field_distribution(p_source text, p_field text, p_since timestamptz)`
  → `(bucket text, count bigint)`. Source ∈ `appointments | leads`.
- `intake_field_timeseries(p_source text, p_field text, p_months int default 12)`
  → `(period date, count bigint, distinct_values bigint)`.
- `intake_field_completeness(p_source text)`
  → `(field text, total bigint, filled bigint, pct numeric)` ordered by
  lowest fill rate first (surfaces questions Aura is dropping).

Field-type → chart mapping lives in `chartKindForField`:
`select|checkbox → donut`, `number → histogram`, `date → timeseries`,
`text → table`. The Intake tab also accepts `?source=` and `?field=` query
params so deep links from Aura / external pages preselect the chart.

## Embedded booking widget (Phase G)

`smart_websites.show_booking_widget` (default `true`) +
`smart_websites.booking_widget_mode` (`inline | modal | hero_cta`) drive how the
public booking flow surfaces on the published Smart Website
(`src/pages/SmartWebsite.tsx`):

- `inline` — renders a `<section id="book">` with `<BookingForm isPublic>` and
  the hero CTA scrolls to it.
- `modal` — hero CTA opens a `Dialog` containing `<BookingForm isPublic>`.
- `hero_cta` — hero CTA links out to `/book/:companySlug`.

The CTA only triggers the embedded form when no custom `cta_button_url` is set;
otherwise the manual URL wins. Submissions go through
`submit_public_booking` (creates a lead with `intake_data`).

`PublicBooking.tsx` accepts `?embed=1` to render a chromeless layout suitable
for iframe embedding on external sites. The Smart Website manager exposes a
copyable iframe snippet at `https://auraintercept.ai/book/{slug}?embed=1`.

`get_website_public_data(text)` was extended to return
`show_booking_widget`, `booking_widget_mode`, and `company_slug`.
## Phase H — Conditional / branching intake fields

`IntakeFieldDef` now supports optional, backward-compatible extensions:

- `show_if?: ShowIfRule[]` — array of `{ field, op, value|values }` rules
  (AND-combined). Operators: `equals`, `not_equals`, `in`, `not_in`,
  `truthy`, `falsy`, `gt`, `gte`, `lt`, `lte`. Hidden fields are skipped by
  validation and not submitted blank.
- `pattern?: string` + `patternMessage?: string` — regex validation for
  text fields. Compiled via `new RegExp`; bad patterns silently no-op.
- `min` / `max` — numeric bounds for `number` fields, length bounds for
  `text` / `textarea`.
- `step?: string` — opt-in multi-step grouping. When ≥2 distinct step ids
  exist, `DynamicIntakeFields` renders a wizard with Back/Next; the Next
  button is disabled while the current step has validation errors.
- `IntakeFormSchema.steps?: Array<{id,label,description?}>` — optional
  ordered step labels. Inferred from field order when omitted.

Helpers:

- `isFieldVisible(field, value)` — evaluate `show_if`.
- `validateIntakeFieldErrors(schema, value)` — per-field error map for
  inline UI (skips hidden fields).
- `validateIntake(schema, value)` — flat error list (now includes
  pattern + min/max errors, not just required-blanks).
- `getSchemaSteps(schema)` — resolve declared/inferred steps.

Renderer (`DynamicIntakeFields`) shows `field.helper` under each input,
replaced by `fieldError` (text-destructive) when validation fails. Pass
`multiStep={false}` to force a flat layout regardless of step grouping.

## Phase J — Aura NL queries over intake analytics

`auraQueryParser` now recognizes the `intake_analytics` intent. Trigger
phrases include `intake`, `field distribution`, `field completeness`,
`fill rate`, `which fields are blank most often`, plus any verbatim
match against a pack field's label, snake_name, or label-without-spaces.

API:
- `parseAuraQuery(query, pack?)` — pass the active pack so phrases like
  "system age" promote to `intake_analytics` and pre-select the field.
- Returned `ParsedQuery.intake = { source, field, view }`:
  - `source`: `appointments` (default) or `leads` if "lead" in query.
  - `view`: `completeness` for blank/empty/fill-rate, `trend` for
    trend/over-time/monthly, otherwise `distribution`.
  - `field`: matched pack field name (longest token wins).
- `buildIntakeAnalyticsHref(target)` → `/dashboard/analytics?tab=…&source=…&field=…&view=…`.
- `getTabFromIntent('intake_analytics')` → `'intake'`.

UI:
- `Analytics.tsx` reads `?tab=` to default the active tab.
- `IntakeAnalytics.tsx` reads `?view=` and auto-scrolls + applies a
  brief `ring-2 ring-primary/40` highlight to the target card
  (Distribution / Trend / Completeness).
- `AskAura.tsx` and `AuraResponseRenderer.tsx` render an "Open in Intake
  analytics" CTA card when the parsed query has an `intake` target.
