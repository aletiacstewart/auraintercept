## Problem

From the screenshot (construction pack) two mismatches are visible:

1. **Sidebar item ↔ console title mismatch.** Sidebar item under FIELD OPS is **"Project Crew"** (correct = `workerConsoleTitle` = "Project Crew Console"). Clicking it opens the page titled **"PROJECT OPERATIONS CONSOLE"** (= `consoleTitle`). They don't match because `FieldOpsConsole.tsx` (the Technician/Worker route) is rendering the dispatcher title.

2. **"FIELD OPS" group label is hardcoded** — every industry sees the same trades-style "Field Ops" section header, even when the rest of the pack is renamed (e.g. construction → Project Ops, salon → Salon Floor, restaurants → Service Floor).

## Root Cause

- `src/pages/ai-consoles/FieldOpsConsole.tsx` (route `/dashboard/ai-consoles/field-ops`) is the **worker / technician** console but uses `serviceConfig.consoleTitle` + `consoleDescription` (the **dispatcher** strings). It should use `workerConsoleTitle` / a worker description.
- `src/components/dashboard/DashboardLayout.tsx` group label `"Field Ops"` (line 120) is a literal string, not derived from the industry pack.

`industryAgentMap.ts` already exposes both names per industry — we just need to wire the worker page to the worker name and add a per-pack section label.

## Fix

### 1. Worker console uses worker title

In `src/pages/ai-consoles/FieldOpsConsole.tsx`, change the header to the worker variant:

```ts
title: serviceConfig.workerConsoleTitle,
description: serviceConfig.workerConsoleDescription
        ?? serviceConfig.consoleDescription,
```

Result for construction: page header reads **"Project Crew Console"**, matching the sidebar's "Project Crew". For salon: "Stylist Console" matches "Stylist". For real estate: "Agent Console" matches "Agent".

`FieldOpsManager.tsx` (the dispatcher page at `/dashboard/dispatch-field-ops`) keeps `consoleTitle` — that one matches the sidebar's dispatch label correctly.

### 2. Add an optional `sectionLabel` to the agent map

Add an optional `fieldOpsSectionLabel` field to `IndustryServiceConsoleConfig` in `src/lib/industryAgentMap.ts`. Populate per industry, with cluster fallback:

```text
construction        -> "Project Ops"
roofing / solar     -> "Project Ops"
landscape           -> "Crew Ops"
pest_control / pool -> "Route Ops"
auto_care           -> "Shop Ops"
appliance_repair    -> "Service Ops"
salon / beauty      -> "Salon Floor"
fitness             -> "Studio Ops"
restaurants         -> "Service Floor"
real_estate         -> "Showings"
professional        -> "Client Ops"
personal_assistant  -> "Concierge Ops"
trades (default)    -> "Field Ops"
```

### 3. Drive the sidebar group label from the pack

In `src/components/dashboard/DashboardLayout.tsx`:

- Add `sectionKey: 'fieldOps'` (optional) to `NavGroup`, set on the Field Ops group.
- After `navLabels` is computed, when rendering each group, replace the literal `"Field Ops"` with `serviceConfig.fieldOpsSectionLabel` (fallback to `"Field Ops"`).
- Hide rule and tier rule unchanged.

### 4. Extend the regression test

In `src/lib/__tests__/consoleNamingConsistency.test.ts`, add assertions:

- `getNavLabels(pack).techView === stripConsole(serviceConfig.workerConsoleTitle)`
- For every industry, `serviceConfig.fieldOpsSectionLabel` is defined OR cluster fallback exists.
- Test that the worker page title equals the sidebar techView (string comparison via the helpers).

## Files Touched

- `src/pages/ai-consoles/FieldOpsConsole.tsx` — switch to `workerConsoleTitle` / worker description.
- `src/lib/industryAgentMap.ts` — add `fieldOpsSectionLabel` per industry + cluster default; optional `workerConsoleDescription` where it differs.
- `src/components/dashboard/DashboardLayout.tsx` — render Field Ops group label from pack.
- `src/lib/__tests__/consoleNamingConsistency.test.ts` — add new assertions.

## Out of Scope

- Renaming routes (`/dashboard/ai-consoles/field-ops`, `/dashboard/dispatch-field-ops`) — labels only.
- Other group labels (Customers, Business, Marketing) — same pattern can be added later if needed; this task is the Field Ops + console mismatch the user called out.

Approve and I'll switch to build mode and apply this in one pass.