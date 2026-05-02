## Phase 10 — Industry Pack QA (DONE)

Logged in as `elitecompany@demo.com` (Demo Elite, real_estate vertical) and
verified industry-aware surfaces end-to-end:

- ✅ **Dashboard**: header reads "Real Estate Dashboard", industry widgets
  block shows real-estate tiles ("Showings Calendar", "Lead Scoring",
  "Listing Tracker", "Review Pulse", "Missed Calls").
- ✅ **Sidebar**: Field-Ops nav resolves to "Listings Map" (vs generic
  "Service Areas"), "Agent View" terminology preserved.
- ✅ **Trial banner + plan badges**: render correctly across vertical.
- ⚠️ **`/book/:slug`** returns "Booking Page Not Found" for the demo
  company — separate functional bug in `get_company_public_info` RPC
  lookup (not industry copy). Tracked for follow-up.
- 📝 **Leads page header**: still generic ("LEADS / Manage and follow up
  on potential customers") — small future polish to wire
  `industryNavLabels` into manager headers, not just nav items.

Industry-aware initiative is functionally complete. Remaining items above
are minor and tracked.

---

## Phase 9 — Industry-Aware Reminder Templates (DONE)

`appointment-reminders` now resolves `getCompanyTerminology` once per
company and exposes `{appointment_noun}`, `{service_noun}`, `{job_noun}`,
`{customer_noun}` to SMS/email/call templates so company-customized
reminder copy can use vertical-specific words without code changes.

Tutorial copy and `LaunchPathSelector` were intentionally **skipped** —
the tutorial is a structural sidebar tour (no job/appointment language to
substitute) and the launch selector copy is plan/path oriented. Industry
phasing is complete.

Phases 6–8 covered KPIs, prompts, forms, reports, inbound notifications,
customer-facing emails, the portal header, and Aura framing. Phase 9 closes
the last generic surfaces: **SMS reminders**, the **tutorial / launch flow**,
and a few stragglers (`appointment-reminders`, `LaunchPathSelector`,
`tutorialSteps`).

## Tasks

### 1. Industry-aware appointment reminders (SMS + Email loop)
`appointment-reminders/index.ts` builds the SMS body inline before posting to
SignalWire and forwards email rendering to `send-appointment-email`. Resolve
`getCompanyTerminology(supabase, companyId)` once per company and substitute
`appointment` / `serviceType` into the SMS message + log payloads. Email side
already inherits Phase 8 wording.

### 2. Industry-aware tutorial copy
Create `src/lib/industryTutorialCopy.ts` exporting `getTutorialCopy(pack)` →
`{ stepTitles, stepDescriptions, examplePrompts }`. Wire into
`useTutorial.ts` and `tutorialSteps.ts`. Cluster-keyed with per-industry
overrides (e.g. "Add your first listing" for real estate, "Add your first
menu item" for restaurants).

### 3. Launch path selector wording
`LaunchPathSelector.tsx` uses generic "service" / "job" copy in its three
option cards. Pull `pack.terminology.job` + `terminology.appointment` so the
guided launch describes the user's actual work (e.g. "schedule your first
showing" vs "book your first reservation").

### 4. Memory + acceptance
Update `mem://features/industry/customer-facing-copy` with the new modules.
Acceptance: switching `industry_id` flips SMS reminder text, tutorial step
labels, and launch path cards without code changes.

## Out of scope
- New tutorial steps or launch flows
- Voice/IVR scripts (already industry-aware via Phase 7 prompts)
- Marketing site

## Technical notes
- Reuse `_shared/terminology.ts` from Phase 8.
- Resolution stays `BY_INDUSTRY[id] ?? BY_CLUSTER[cluster] ?? GENERIC`.
- New file: `src/lib/industryTutorialCopy.ts`.

---

## Phase 8 — Industry-Aware Outbound, Tutorial & Customer Portal Polish (DONE)

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