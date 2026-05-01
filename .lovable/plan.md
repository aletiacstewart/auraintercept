# Phase F — Reporting & Analytics on intake_data

Goal: turn the per-industry `intake_data` JSONB now flowing into `appointments` and `leads` into actionable insight. Operators should be able to see distributions (e.g. HVAC system age, Real Estate pre-approval rate, Salon allergy frequency) directly in the Analytics console, scoped to their company and to whichever fields their industry pack actually defines.

Out of scope: cross-company benchmarking, exporting to BI tools, conditional/branching field upgrades, public widget embedding (those are separate phases).

## What gets built

### 1. Schema-aware field discovery

A small helper resolves which intake fields are reportable for the current company.

- `src/lib/intakeAnalytics.ts` (new) — given the resolved industry pack, walks `form_schemas[*].fields[*]` and returns a deduped list of `{ name, label, type, options?, sourceFormIds[] }`. Skips `textarea` (free text) for charting.
- Field types map to chart types:
  - `select`, `checkbox` → bar / donut (categorical)
  - `number` → histogram with bucketed ranges
  - `date` → time-series line (by month)
  - `text` → top-N value table only

### 2. Database RPCs (SECURITY DEFINER, company-scoped)

All scoped via `get_user_company_id(auth.uid())`; platform admins get full scope. New migration adds:

- `intake_field_distribution(p_source text, p_field text, p_since timestamptz default null) → (bucket text, count int)`
  - `p_source` ∈ `'appointments' | 'leads'`.
  - For categorical fields: `select intake_data->>p_field as bucket, count(*)`.
  - For numeric fields: caller passes the field; the RPC casts to numeric, NULL-skips, and returns 6 width-bucketed ranges via `width_bucket`.
  - Returns empty set if caller has no company.
- `intake_field_timeseries(p_source text, p_field text, p_interval text default 'month') → (period date, count int, distinct_values int)`
  - For tracking volume/diversity of a captured field over time.
- `intake_field_completeness(p_source text) → (field text, total int, filled int, pct numeric)`
  - One row per known key seen in `intake_data` for the company — surfaces which questions agents are actually getting answers for.

GIN indexes from Phase E already cover the lookups; no new indexes needed.

### 3. New analytics tab

- `src/components/analytics/IntakeAnalytics.tsx` (new) mounted as a tab on `Analytics.tsx` (and on `pages/ai-consoles/AnalyticsConsole.tsx` for the Aura-driven view).
- Layout:
  - Header: source toggle (Appointments / Leads), date range chips (30d / 90d / All).
  - Field picker: dropdown driven by `intakeAnalytics.ts`. Defaults to the first categorical field; greyed-out + tooltip when the company has no industry pack.
  - Three cards:
    1. **Distribution** — bar/donut/histogram driven by `intake_field_distribution`.
    2. **Trend** — line chart from `intake_field_timeseries`.
    3. **Completeness** — table from `intake_field_completeness`, sorted by lowest fill rate (these are the questions Aura is dropping).
  - Empty state: links straight to `/dashboard/agents` with a hint to enable the booking agent and reminds the user that data accrues as appointments/leads are captured.
- Reuses existing `recharts` primitives already in `src/components/analytics/*` (see `RevenueAnalytics.tsx`, `PerformanceAnalytics.tsx` for the chart wrapper conventions). Theme tokens only — no hex.

### 4. Aura natural-language hook

`src/lib/auraQueryParser.ts` learns three intents so admins can say "show me HVAC system age distribution" or "which intake fields are blank most often":

- Map verb + noun → `IntakeAnalytics` tab + preselected field.
- Wire through `useAuraCommand` so the existing Cyber-Sentry command bar can deep-link to the tab with `?source=appointments&field=system_age`.
- `IntakeAnalytics` reads those query params on mount.

### 5. Memory + docs

- Update `mem://features/industry/pack-data-fields.md` with a "Reporting" section documenting the three RPCs and the categorical-vs-numeric mapping.
- Update `mem://features/analytics/comprehensive-dashboard-suite.md` to list the new tab.

## Files

New
- `supabase/migrations/<ts>_intake_analytics_rpcs.sql`
- `src/lib/intakeAnalytics.ts`
- `src/components/analytics/IntakeAnalytics.tsx`

Edited
- `src/pages/Analytics.tsx` — add tab.
- `src/pages/ai-consoles/AnalyticsConsole.tsx` — add tab + Aura intent hook.
- `src/lib/auraQueryParser.ts` — recognize intake-analytics intents.
- `src/integrations/supabase/types.ts` — auto-regen after migration.
- `.lovable/memory/features/industry/pack-data-fields.md`

## QA

1. Switch demo company to HVAC, create 3 appointments with different `system_age` and `unit_type` values, open Analytics → Intake tab → confirm distribution + completeness reflect the data.
2. Switch to Real Estate, repeat with `buyer_pre_approved`. Confirm donut renders.
3. Generic / no industry pack → tab shows "No industry intake fields configured" empty state and the field picker is disabled.
4. Run "Aura, show me intake completeness" → routes to the Completeness card.
5. Confirm RPCs reject cross-company access by querying as a different company's user.

After approval I'll add the migration, RPCs, the new tab, the Aura intent, and update the memory files.

---

# Phase G — Embedded booking widget on Smart Website (DONE)

## What shipped

- DB: `smart_websites.show_booking_widget` (bool, default true) +
  `smart_websites.booking_widget_mode` (`inline | modal | hero_cta`, check
  constraint). `get_website_public_data(text)` recreated to return the new
  fields plus `company_slug`.
- `src/pages/SmartWebsite.tsx`: hero CTA respects custom `cta_url`; otherwise
  scrolls to inline `<section id="book">` or opens a modal `Dialog` containing
  `<BookingForm isPublic companyId={...}>`. Services query no longer gated by
  `show_services` when the booking widget is on.
- `src/pages/PublicBooking.tsx`: `?embed=1` renders a chromeless layout for
  iframe embeds.
- `src/pages/SmartWebsiteManager.tsx`: new "Booking widget" block (toggle +
  mode select + copyable iframe snippet pointing at
  `https://auraintercept.ai/book/{slug}?embed=1`).
- Memory: `mem://features/industry/pack-data-fields.md` updated with the
  Phase G section.