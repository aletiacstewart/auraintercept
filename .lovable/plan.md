## Goal

1. Hide field-travel UI ("Arrive", "On The Way", "En Route", "Directions") on employee + company consoles for industries that don't dispatch to a customer location (restaurants, salon, beauty_wellness, fitness, real_estate, professional, personal_assistant, and the entire booking cluster).
2. Audit and update remaining marketing/docs/pricing copy so Industry Specialist Operatives are clearly stated as **active on every plan, gated by industry only** — not by tier. (The runtime gating already works; the static content lags behind.)

---

## Part 1 — Hide "Arrive" / travel actions for non-field industries

Use existing `hasFieldTechnicians(pack)` from `src/lib/industryCapabilities.ts` (already returns false for booking-cluster + the 7 listed industries).

### Files to edit

**`src/components/employee/FieldOpsAgentConsole.tsx`**
- Read `pack` via `useIndustryPack()` and compute `const isFieldDispatch = hasFieldTechnicians(pack)`.
- In the quick-action list that produces `directions`, `enroute`, `eta`, `arrive_start`, `dispatch`: when `!isFieldDispatch`, drop `directions`, `enroute`, `eta`, `arrive_start`, `dispatch` and instead surface a single `start` action (status → `in_progress` directly) plus existing `complete`, `reschedule`, `quote`, `invoice`, `accept`, `decline`.
- Add a `handleSelectJobForStart` (status `in_progress` only, no `arrived_at`, no arrival SMS) and a `selectorMode === 'start'` config.
- Reuse `serviceConfig.fieldRouting` only as a secondary signal; primary gate is `isFieldDispatch`.

**`src/components/employee/TechnicianJobQueue.tsx`**
- Accept `isFieldDispatch` (derive from `useIndustryPack` inside, since this component already self-fetches).
- When false: hide the "I've Arrived" button (keep "Start"), hide the "Arrived" KPI tile, and remove the `arrived` step from the status timeline.

**`src/components/company/CompanyJobQueue.tsx`**
- Same: hide `arrived` status chip + filter for non-field industries.

**`src/components/ai/AppointmentTrackingView.tsx`**
- Hide the "On The Way" and "Arrived" badge variants when `!isFieldDispatch`; collapse to "Scheduled → In Progress → Complete".

**`src/components/ai/agents/JobStatusMonitor.tsx`** and **`src/components/employee/AppointmentCalendar.tsx`** and **`src/components/employee/CompletedJobsHistory.tsx`**
- Conditionally skip the `arrived` row/label when `!isFieldDispatch`.

**`src/components/fieldops/RealTimeETASidebar.tsx`** and **`src/components/fieldops/DispatcherMapView.tsx`**
- These are already gated at the page level via `hasFieldTechnicians` in `src/pages/FieldOperations.tsx`. No change needed beyond confirming the page-level guard still hides the whole sidebar.

**`src/components/ai/chat/AgentHowToGuide.tsx`**
- The "Arrive & Start Job" how-to entry: filter it out of the guide list when `!isFieldDispatch`.

### Out of scope
- The underlying `job_assignments.status='arrived'` column stays in the DB (data model unchanged). We just hide the UI affordances for non-field verticals.

---

## Part 2 — Specialist Operatives copy alignment

Runtime is already correct (`SPECIALIST_MIN_TIER='free'`, `tierAllowsSpecialists()` always true, pack-driven activation). These static surfaces still imply gating and need updating:

**`src/pages/Subscription.tsx`** — line 788 paragraph: rewrite to drop "Pro adds…industry-specific specialist agents" and instead say something like *"Industry Specialist Operatives (Diagnostic, Permit & Code, Site Survey, Insurance Claim, Listing Writer, Style Consultant, Menu Writer, etc.) auto-activate based on the industry you choose at signup — included on every plan, including the 90-Day Live Trial."* Keep the per-tier highlight lines as they already say "+ Industry Specialists".

**`src/components/documentation/PricingSummaryPDF.tsx`**
- Line 228: change the comparison row from `core: '-', boost: '-', pro: 'Yes', elite: 'Yes'` to `'Included (by industry)'` across all four tiers.
- Line 407 (Pro tier section): demote "Industry Specialist Agents (Diagnostic, …)" from Pro-exclusive bullet to a generic note that they're included on all plans.
- Line 455 (Elite): change "All Industry Specialist Agents included" → "All Industry Specialist Agents (same as every plan, industry-gated)".

**`src/components/documentation/WebsiteCopyPDF.tsx`** — line 530/535: remove "Industry Specialist Agents" from the Pro tier exclusives bullet; add a universal note in the intro or Core tier block that specialists ship on every plan.

**`src/components/documentation/SalesPitchDataPDF.tsx`** — line 798: rephrase "Industry Specialist Agents included" so it doesn't read like a Pro-only perk (or add the same bullet to Core/Boost blocks).

**`src/lib/howToUseContent.ts` / `src/lib/helpContentConfig.ts` / `src/lib/documentationConfig.ts`** — search for any remaining "available on Pro and above" or "performance/command-only" specialist phrasing and adjust to "available on all plans, activated by your industry".

**`src/lib/subscriptionAgentConfig.ts`** — update the tier `description` strings on `performance` ("…and industry specialist agents") and the comment on line 91 ("All 10 consolidated operatives + industry specialists") to clarify specialists are not what makes Pro/Elite distinct.

**Memory** — `.lovable/memory/features/ai-operatives/specialists-all-plans.md` is already correct; no change.

---

## Verification

1. Sign in as a demo **Salon** or **Restaurant** company → open Service Management Console → no "Arrive & Start", "En Route", "Directions", "ETA" buttons; "Start" + "Complete" + "Reschedule" remain. No "Arrived" badge/column in job queue or appointment tracking.
2. Sign in as a demo **HVAC** or **Plumbing** company → full field-ops actions still render (regression).
3. Visit `/subscription` → all four tier cards still show "+ Industry Specialists" and the paragraph copy reads consistently across tiers.
4. Open the generated Pricing Summary PDF preview → Specialist row shows "Included (by industry)" across all four columns.
5. `npm test` (existing vitest suite) stays green.

---

## Technical notes (engineer-only)

- `hasFieldTechnicians()` already returns false for: booking cluster + `restaurants`, `real_estate`, `beauty_wellness`, `salon`, `fitness`, `professional`, `personal_assistant`. Healthcare packs added recently (`home_health`, `physical_therapy`, `occupational_therapy`, `hospice`) DO travel to patient — confirm they're NOT in the NO_TECH set (they aren't, so they keep Arrive actions — correct for home health).
- No DB migration required.
- No edge-function changes required.
