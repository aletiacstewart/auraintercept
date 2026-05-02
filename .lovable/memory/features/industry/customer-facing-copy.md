---
name: Industry-Aware Customer-Facing Copy
description: Phase 8 — portal header, public booking, customer email defaults, Aura framing, and welcome modal substitute industry-specific nouns
type: feature
---
Phase 8 closed the remaining generic customer-facing surfaces. Resolution
follows the standard hierarchy: BY_INDUSTRY[id] -> BY_CLUSTER[cluster] -> GENERIC.

## Frontend modules

- `src/lib/industryPortalCopy.ts` — extended with `portalHeaderLabel` and
  `welcomeSubtitle`. Wired into `CustomerPortalHome` (header pill + intro
  line above quick actions). `PortalQuickActions` already uses it.
- `src/lib/industryAuraFraming.ts` — exports `getAuraFraming(pack)` returning
  `analyzingLabel`, `trendChartTitle`, `jobsHeader`, `appointmentsHeader`,
  `emptyJobs`, `emptyAppointments`. Wired into `AuraSummary` (loading text)
  and `AuraResponseRenderer` (default chart title).
- `src/pages/PublicBooking.tsx` — uses `usePublicIndustryPack(company.id)` and
  swaps "appointment" with `pack.terminology.appointment` in the header label,
  toast, and confirmation copy.
- `src/components/onboarding/WelcomeModal.tsx` — technician + employee
  variants substitute `jobNoun` / `apptNoun` from the active pack.

## Edge functions

- `supabase/functions/_shared/terminology.ts` — `getCompanyTerminology(supabase, companyId)`
  returns `{ job, appointment, customer, serviceType }` from
  `get_company_industry_pack` with safe defaults.
- `supabase/functions/send-appointment-email/index.ts` — default subject,
  heading, message, "Manage Your X" CTA, and "X Details" header all use
  `term.appointment` (e.g. "Reservation Confirmed", "Showing Reminder").
- `supabase/functions/send-review-request/index.ts` — falls back to
  `term.serviceType.toLowerCase()` instead of the literal "service" when the
  appointment row has no `service_type`. Also exposes `{job_noun}` and
  `{appointment_noun}` template variables for company-customized templates.

`send-appointment-sms` is intentionally NOT touched — it is a thin SignalWire
relay; callers (ai-agent-chat, customer-portal, booking-actions, employee
components) compose the message text themselves.

## Acceptance

Switching `companies.industry_vertical` to `restaurants` flips:
- Customer portal header: "Customer Portal" -> "Guest Portal"
- Public booking: "Request an appointment" -> "Request a reservation"
- Confirmation email subject: "Appointment Confirmed" -> "Reservation Confirmed"
- Aura loading bubble + chart titles inherit vertical phrasing
- Welcome modal greets technicians with "View Today's Reservations"

...without code changes.