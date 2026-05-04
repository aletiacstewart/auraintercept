
## Problem

The sidebar labels and the console page titles drift apart. In the screenshots (construction pack), the sidebar shows **Technician View** + **Shop Queue**, but the consoles show **Project Operations Console** + **Dispatch-Field Ops**. Same pattern exists for other industries because two unrelated config files own the names.

## Root Cause

Three independent label sources, none synced:

1. **Sidebar labels** — `src/lib/industryNavLabels.ts` (`techView` / `dispatchView`)
   - Construction is not listed in `INDUSTRY_OVERRIDES`, so it falls back to the cluster default → "Technician View" + "Shop Queue" (repair cluster default).
2. **Field-Ops Console title** — `src/lib/industryAgentMap.ts` (`consoleTitle`, `workerConsoleTitle`)
   - Construction → "Project Operations Console" / "Project Crew Console".
3. **Dispatch console header** — hardcoded literal `"Dispatch-Field Ops"` in `src/components/fieldops/FieldOpsManager.tsx` (line 423). Ignores the pack entirely.

So every industry can have up to three different names for the same surface.

## Fix — make `industryAgentMap.ts` the single source of truth

The agent map already has the richest per-industry naming (`consoleTitle`, `workerConsoleTitle`, `teamMemberNoun`, `jobNoun`). Drive everything else from it.

### 1. Derive sidebar labels from the agent map

In `src/lib/industryNavLabels.ts`, replace the static `INDUSTRY_OVERRIDES` for `techView` / `dispatchView` with values pulled from `getIndustryServiceConsoleConfig(pack)`:

- `techView` ← `workerConsoleTitle` (e.g. "Project Crew Console" → displayed as "Project Crew")
- `dispatchView` ← `consoleTitle` (e.g. "Project Operations Console" → displayed as "Project Operations")

Strip the trailing " Console" suffix when used as a sidebar label so the sidebar stays compact, but keep the full name on the page header. Cluster fallbacks stay as today.

### 2. Make the dispatch header industry-aware

In `src/components/fieldops/FieldOpsManager.tsx`:
- Read `useIndustryPack()` + `getIndustryServiceConsoleConfig(pack)`
- Replace the hardcoded `"Dispatch-Field Ops"` h1 and its description with `consoleTitle` and `consoleDescription` from the pack.

### 3. Audit & fill missing per-industry entries in `industryAgentMap.ts`

Walk every `industry_id` that ships in the pack registry and verify it has:
- `consoleTitle` (used by Field Ops Console + sidebar dispatch label)
- `workerConsoleTitle` (used by Technician layout + sidebar tech label)
- `teamMemberNoun`, `jobNoun`

Industries currently relying on cluster defaults that should get explicit titles for consistency:
- `construction`, `roofing`, `solar`, `fencing`, `handyman`, `security_systems`, `mobile_mechanic`, `auto_care`, `landscape`, `pool_spa`, `pest_control`, `appliance_repair`, plus all booking-cluster industries (`real_estate`, `restaurants`, `beauty_wellness`, `salon`, `fitness`, `professional`, `personal_assistant`).

Each gets a matching pair, e.g.:

```text
construction:  Project Operations Console  / Project Crew Console
roofing:       Roofing Operations Console  / Roofing Crew Console
landscape:     Crew Route Console          / Crew Console
real_estate:   Showing Console             / Agent Console
salon:         Chair Schedule Console      / Stylist Console
restaurants:   Guest Flow Console          / Server Console
```

### 4. Match the Technician layout title to the same source

In `src/components/dashboard/TechnicianDashboardLayout.tsx`, replace any hardcoded "Technician" header with `workerConsoleTitle` from the same helper so a construction tech sees "Project Crew Console", a salon stylist sees "Stylist Console", etc.

### 5. Add a regression test

Add `src/lib/__tests__/consoleNamingConsistency.test.ts` that, for every industry pack, asserts:
- `getNavLabels(pack).techView` matches the worker console title (minus " Console")
- `getNavLabels(pack).dispatchView` matches the dispatch console title (minus " Console")

This prevents future drift.

## Files Touched

- `src/lib/industryNavLabels.ts` — derive from agent map
- `src/lib/industryAgentMap.ts` — fill missing per-industry titles
- `src/components/fieldops/FieldOpsManager.tsx` — replace hardcoded header
- `src/components/dashboard/TechnicianDashboardLayout.tsx` — use worker title
- `src/lib/__tests__/consoleNamingConsistency.test.ts` — new test

## Out of Scope

- Renaming routes (`/dashboard/dispatch-field-ops` etc.) — labels only.
- Marketing/landing copy — separate surface.
- Customer-portal rollup labels in `agentStyles.ts` — already canonical.

Approve and I'll switch to build mode and apply this in one pass.
