## Phase 8 — Industry-Aware Outbound, Tutorial & Customer Portal Polish

Phases 6–7 made KPIs, prompts, forms, reports, and inbound notifications industry-aware. Phase 8 closes the remaining generic surfaces: **customer-facing copy** (portal, public booking, customer emails/SMS), **onboarding/tutorial flows**, and **Aura's response framing**, so a buyer in a real-estate vertical never sees "service request" and a restaurant guest never sees "appointment".

## Tasks (in order)

### 1. Industry-aware Customer Portal copy
`CustomerPortalHome` and `PortalQuickActions` still ship "Customer Portal" / "Service Request" text. Wire them to `industryPortalCopy.ts` (already exists from Phase 6) so the header title, action labels, and empty-state hints become "Buyer Portal" / "Guest Portal" / "Client Portal" per cluster. Also extend `getPortalCopy(pack)` with `welcomeTitle`, `welcomeSubtitle`, and `requestActionLabel`.

### 2. Industry-aware public booking + customer-facing emails/SMS
- **PublicBooking page**: replace hardcoded "Book a Service" / "Service Type" with `pack.terminology.appointment` + `terminology.serviceType`. Update CTA, page title, confirmation screen.
- **Customer-facing edge functions**: `send-appointment-email`, `send-appointment-sms`, `appointment-reminders`, `send-review-request` — pull `terminology.appointment` / `terminology.job` from the company row (same RPC pattern Phase 7 added to `send-job-notification`) and substitute into subject + body templates.

### 3. Industry-aware Aura response framing
`AuraResponseRenderer` and `AuraSummary` use generic phrasing ("Here are your jobs", "No appointments today"). Add `industryAuraFraming.ts` exporting `getAuraFraming(pack)` returning `{ jobsHeader, appointmentsHeader, customersHeader, emptyJobs, emptyAppointments }`. Wire into both components plus `AuraQuickResponsePopup`.

### 4. Industry-aware Tutorial + Welcome onboarding
`tutorialSteps.ts`, `WelcomeModal`, and `LaunchPathSelector` use generic verbs ("Add your first job"). Build `industryTutorialCopy.ts` keyed by cluster with overrides per industry. The tutorial step titles, descriptions, and example prompts all resolve from the active pack. `WelcomeModal` greeting line uses `pack.terminology.businessNoun`.

### 5. Memory + acceptance
Add `mem://features/industry/customer-facing-copy` to the index documenting the new framing modules. Acceptance: switching `industry_id` on a company changes:
- Portal header + actions
- Public booking page + customer SMS/email subjects
- Aura response headers + empty states
- Tutorial step copy + welcome greeting

…with no further code changes.

## Out of scope
- New tutorial steps or onboarding flows (only copy)
- New portal routes or booking functionality
- Marketing site (already industry-aware)

## Technical notes
- Reuse the Phase 7 RPC `get_company_terminology(company_id)` for edge functions — extend it to also return `appointment` and `serviceType` if not already.
- Resolution hierarchy stays consistent: `BY_INDUSTRY[id] ?? BY_CLUSTER[cluster] ?? GENERIC`.
- All new lib files follow the `industry*.ts` naming under `src/lib/`.
- Edge function imports use `_shared/industry-pack.ts` (already present).

Run all 5 tasks in order as one phase, or split into individual approvals.