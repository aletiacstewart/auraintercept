# Plan: Industry-Specific "Dispatch/GPS Console" Naming

## Goal
For every industry that uses the Dispatch AI agent (technicians/repair people sent to homes/offices), unify naming so that:
- The **sidebar group label**, the **Dispatch sub-item**, and the **page H1** all match.
- Each industry gets its own branded title using the pattern:
  - **Admin/Dispatch view**: `{Industry} Dispatch/GPS Console` (e.g. "HVAC Dispatch/GPS Console", "Plumbing Dispatch/GPS Console")
  - **Worker/Field view**: `{Industry} Ops Console` (e.g. "Electrician Ops Console", "Plumber Ops Console")
- Non-dispatch verticals (salon, fitness, restaurant, real estate, professional, personal_assistant, etc.) are **untouched** — they keep current labels.

## Scope: Dispatch industries
HVAC, Plumbing, Electrical, Appliance Repair, Landscape, Pest Control, Pool & Spa, Roofing, Solar, Fencing, Construction, Handyman, Security Systems, Mobile Mechanic.

## Changes

### 1. `src/lib/industryAgentMap.ts` — single source of truth
Update `INDUSTRY_SERVICE_CONSOLE_OVERRIDES` for each dispatch industry above so each entry sets:
- `consoleTitle: "{Industry} Dispatch/GPS Console"` (admin dispatch view)
- `workerConsoleTitle: "{Worker} Ops Console"` (e.g. "Electrician Ops Console", "Plumber Ops Console", "HVAC Tech Ops Console", "Crew Ops Console", "Pest Tech Ops Console", etc.)
- `fieldOpsSectionLabel: "Dispatch/GPS"` (sidebar group)
- Add a new optional field `dispatchSubItemLabel: "Dispatch/GPS Console"` and `workerSubItemLabel: "{Worker} Ops Console"` so the sidebar items match the page H1 exactly.

Generic fallback (`fieldRouting=true`) → `consoleTitle: "Dispatch/GPS Console"`, `workerConsoleTitle: "Field Ops Console"`, `fieldOpsSectionLabel: "Dispatch/GPS"`.

Non-dispatch packs are not modified.

### 2. `src/components/dashboard/DashboardLayout.tsx`
- Sidebar group already reads `serviceConfig.fieldOpsSectionLabel` (line 461) — no logic change, new labels flow through automatically.
- Update the two child items (lines 136-137) to read labels from `serviceConfig.workerSubItemLabel` and `serviceConfig.dispatchSubItemLabel` (with current strings as fallback) so "Technician View"/"Dispatch View" become e.g. "Electrician Ops Console" / "Dispatch/GPS Console" for dispatch industries; non-dispatch industries keep current labels via fallback.

### 3. Page H1s already use `serviceConfig` — verify only
- `src/pages/ai-consoles/FieldOpsConsole.tsx` already uses `serviceConfig.workerConsoleTitle` (line 38) ✓
- `src/pages/DispatchFieldOpsApp.tsx` and `src/components/fieldops/FieldOpsConsole.tsx` — confirm they render `serviceConfig.consoleTitle`; if a hard-coded "Dispatch Field Ops" string exists, swap to `serviceConfig.consoleTitle`.

### 4. Demo seeding
No DB changes required — labels are derived at render time from each company's `industry_vertical`. Existing demo accounts will pick up new names on next page load.

## Out of scope
- Non-dispatch verticals (salon, fitness, restaurant, real estate, professional services, SaaS, personal assistant, etc.) — labels unchanged.
- PDFs, docs, marketing pages — already use "Dispatch/GPS Console" from prior pass.
- Backend/agent IDs — `dispatch` and `field_operations` keys remain unchanged.

## Verification
1. Switch demo to HVAC → sidebar shows group "Dispatch/GPS", items "HVAC Tech Ops Console" + "Dispatch/GPS Console"; pages render matching H1s.
2. Switch demo to Plumbing/Electrical/etc. → industry-prefixed titles appear consistently.
3. Switch demo to Salon/Fitness/Professional → labels unchanged.
