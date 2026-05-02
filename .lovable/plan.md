# Industry-Aware Tab Labels + Generic Form Prefills

## Problem

1. **"Job Queue" tab** is hardcoded everywhere — even for booking-cluster industries (salon, restaurants, real estate, fitness, professional, personal_assistant) where it should read "Booking Queue", "Reservation Queue", "Showing Queue", etc. Same issue with "All Jobs", "No Active Jobs", "New job assignments will appear here".
2. **Form placeholders** like `"e.g., HVAC repair"` in the Lead form are trades-specific and leak into all industries (salon, restaurants, real estate). Placeholder should be generic — derived from the field title only (e.g., "Service interest…").

## Scope

### A. Industry-aware Appointments/Bookings tabs

Extend `src/lib/industryNavLabels.ts` with a new resolver:

```ts
export interface IndustryQueueLabels {
  queueTab: string;        // "Job Queue" | "Booking Queue" | "Reservation Queue" | "Showing Queue" | "Class Roster" | "Service Queue"
  allJobsTab: string;      // "All Jobs" | "All Bookings" | "All Reservations" | …
  emptyTitle: string;      // "No Active Jobs" | "No Active Bookings" | …
  emptyHint: string;       // "New {jobNoun} assignments will appear here"
}
export function getQueueLabels(pack: IndustryPack | null): IndustryQueueLabels
```

Resolution: industry override → cluster default → trades fallback. Labels derive from existing `jobNoun` ("Booking", "Reservation", "Showing", "Class", "Repair Order", etc.) so we don't duplicate per-industry tables.

Wire it into:
- `src/components/appointments/AppointmentsManager.tsx` (tabs at lines 62–73)
- `src/pages/EmployeeAppointments.tsx` (tabs at lines 55–66)
- `src/components/employee/TechnicianJobQueue.tsx` empty state (lines 476–477)
- `src/components/company/CompanyJobQueue.tsx` empty state (line 284)
- `src/components/dashboard/EmployeeDashboard.tsx` quick-link label "Job Queue" (line 134) — uses `queueTab`

Both managers will read `useIndustryPack()` and pass labels to the tab triggers + child components (via prop or context). Empty-state components accept optional `title`/`hint` props with the current strings as fallback.

Architecture/Auth/Help pages (static marketing/docs copy with "Job Queue") remain unchanged — they describe the trades feature, not a live console.

### B. Generic form prefills

Replace HVAC-specific placeholder in `src/components/marketing/forms/LeadForm.tsx` line 249:
- Before: `placeholder="e.g., HVAC repair"`
- After: derive from the label only — `placeholder="Service interest"` (just the field title, no industry-specific example)

Sweep audit (already searched): only `LeadForm.tsx` and `AgentTestConsole.tsx` carry "HVAC repair". `AgentTestConsole.tsx` is an internal admin test tool — leave as-is unless flagged. Confirm: leave admin test console untouched.

Apply same rule to any other generic placeholders that name a vertical-specific example. Quick re-scan during implementation:
```
rg "e\.g\., (HVAC|plumbing|salon|haircut|landscaping)" src/
```
Each hit becomes either `placeholder={label}` or removed entirely (no placeholder text).

## Files modified

- `src/lib/industryNavLabels.ts` — add `getQueueLabels` + `IndustryQueueLabels`
- `src/components/appointments/AppointmentsManager.tsx`
- `src/pages/EmployeeAppointments.tsx`
- `src/components/employee/TechnicianJobQueue.tsx` — accept optional `emptyTitle`/`emptyHint` props
- `src/components/company/CompanyJobQueue.tsx` — same
- `src/components/dashboard/EmployeeDashboard.tsx` — dynamic "Job Queue" quick link label
- `src/components/marketing/forms/LeadForm.tsx` — generic placeholder

## Out of scope

- Marketing landing pages, Auth tour copy, Architecture mermaid diagrams (these describe trades scenarios intentionally).
- Per-industry icon swap on the tabs (still `ClipboardList`/`Briefcase` — universal).
- Renaming the route `/dashboard/ai-consoles/marketing-sales` or sidebar item "Bookings" (already correct).

## Verification

- Salon admin → Bookings tabs read **Calendar / Booking Queue / History / All Bookings**, empty state "No Active Bookings".
- Restaurants → **Reservation Queue / All Reservations**, "No Active Reservations".
- Real estate → **Showing Queue / All Showings**.
- Trades / HVAC → unchanged ("Job Queue / All Jobs").
- LeadForm "Service Interest" placeholder no longer mentions HVAC for any industry.
