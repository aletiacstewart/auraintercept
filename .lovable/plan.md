# Phase 7 — Industry-Aware Forms, Reports & Aura Suggestions

Phase 6 made KPIs, prompts, portals, onboarding, and empty states industry-aware. Phase 7 closes the loop on the **input side** (forms) and the **output side** (reports + Aura's proactive suggestions) so an operator never sees generic copy in their daily flow.

## Tasks (in order)

### 1. Industry-aware create/edit form labels
The "Add Job", "Add Lead", "Add Customer" forms still ship generic field labels ("Service Type", "Job Notes"). Use the existing `industryFormSchemas.ts` pack data to drive:
- Field labels (e.g. trades "Service Type" → real-estate "Listing Type" → restaurant "Reservation Type")
- Placeholders + helper text
- Optional/required field visibility per cluster (real-estate hides "Service Address" on listings; restaurants hide "Job Site")

Surfaces: `JobForm`, `LeadForm`, `QuoteForm`, `CustomerForm`, `AppointmentForm`. Build one shared `useIndustryFieldLabel(surface, field)` hook backed by `pack.terminology` + a new `industryFieldLabels.ts` map for fields not already covered.

### 2. Industry-aware quick-create dropdowns + Aura suggestions
The header "+" button and Aura's "Try asking…" chips currently show a fixed list. Wire both to `industryQuickActions.ts` so:
- Header quick-create shows the top 3 actions for the active vertical (e.g. salon → "Book appointment / Add stylist / Send promo")
- Aura suggestion chips on `/dashboard` and `/aura` rotate vertical-specific prompts ("Show me tomorrow's reservations" for restaurants vs "Show me today's route" for trades)

Touch: `DashboardHeader` (or equivalent quick-create), `AuraCommandCenter` suggestion list, `AskAura` page.

### 3. Industry-aware report templates
`/analytics` already routes to per-vertical KPIs. Extend the export/PDF report templates so the generated report title, section headings, and metric labels match the vertical. Add `industryReportTemplates.ts` returning section blueprints per cluster (e.g. real-estate → "Listings Performance / Showings / Buyer Pipeline"; restaurant → "Covers / Avg Ticket / Reservation Conversion").

Wire into the existing analytics export flow only — no new export routes.

### 4. Industry-aware notification copy
Staff push/email/SMS alerts currently say "New job assigned". Make the verb match the terminology (`New showing assigned`, `New reservation`, `New appointment`). Single tweak in `send-staff-notification` + `send-job-notification` edge functions: pull `terminology.job` / `terminology.appointment` from the company row and substitute into the title + body.

### 5. Memory + acceptance
Add `mem://features/industry/forms-and-reports` to the index. Acceptance: switching `industry_id` changes form labels, quick-create options, Aura chips, exported report headings, and outbound notification copy without further code changes.

## Out of scope
- New form fields (only labels/visibility of existing ones)
- New analytics queries (only labels around existing data)
- Marketing site / public booking widget (already industry-aware)

If you want, I can split this into 5 separate approvals (one per task) or run it as one phase. Default is all 5 in order.
