
## Problem

- Tech Ops Console (`FieldOpsAgentConsole`) shows Assignment Agent `0 Jobs / 0 Assigned` and Routing Agent `0 Pending / 0 Done Today` while Dispatch/GPS Console (`FieldOpsManager`) shows `5 Active`.
- Both surfaces query `public.job_assignments` scoped to the same `company_id`, so the numbers should never disagree by definition.
- Root cause of the visible gap is definition, not source: `useFieldOpsMetrics.jobsTotal` counts **every** row on the company (including completed / cancelled). Dispatch's "Active" = `status NOT IN ('completed','cancelled')`. On an empty/new tenant `jobsTotal` and `jobsPending` are both 0, but on any tenant with historical completed rows the Assignment tile will read *higher* than Dispatch — the opposite mismatch. Either way the tiles and the header badge don't line up because they use different filters and identical labels ("Jobs" / "Pending").
- `CyberConsoleLayout` renders a hardcoded `Satisfaction: 98.4%` when no `sessionMetrics` prop is passed (Tech Ops never passes one), regardless of whether any completed jobs or feedback exist.

## Fix

Single source of truth = `job_assignments` filtered by `company_id`. Redefine the metrics hook and rewire the two agent tiles so their numbers add up to Dispatch's Active total, and label them explicitly so scope is visible.

### 1. `src/hooks/useConsoleAgentMetrics.ts` — `useFieldOpsMetrics`

Replace the current shape with counts that share Dispatch's definitions and add supporting slices:

- `jobsActive` — `status NOT IN ('completed','cancelled')` — matches Dispatch's `stats.total`.
- `jobsAssigned` — active AND `employee_id IS NOT NULL`.
- `jobsUnassigned` — active AND `employee_id IS NULL` (or status = `pending_acceptance`).
- `jobsPending` — active AND status IN (`pending_acceptance`,`accepted`).
- `jobsInProgress` — status IN (`en_route`,`arrived`,`in_progress`).
- `jobsCompletedToday` — `status = 'completed'` AND `completed_at >= todayStart`.
- `feedbackCount` and `avgRating` — one read from `customer_feedback` for today's satisfaction stat.

Keep the old field names as aliases (`jobsTotal = jobsActive`, `jobsEnRoute = jobsInProgress`) so nothing else breaks; update callers in the next step.

### 2. `src/components/employee/FieldOpsAgentConsole.tsx`

Rewire `FIELDOPS_AGENTS`:

- **Assignment Agent (index 0)** → `metric1 = jobsActive` label **"Active"**, `metric2 = jobsAssigned` label **"Assigned"**. Sanity: `jobsAssigned + jobsUnassigned === jobsActive`.
- **Routing Agent (index 1)** → `metric1 = jobsPending` label **"Pending"**, `metric2 = jobsInProgress` label **"In Progress"** (was "Done Today", which duplicated completed-today info and hid the real routing workload). Add a small caption "Done today: N" underneath if trivial to slot in, otherwise leave out.

Because these tile labels come from `industryAgentMap.ts` (`metric1Label` / `metric2Label` on `ServiceOperativeCard`), update the field/booking operative factories there too so every vertical using `fieldOperatives()` / `bookingOperatives()` gets the new labels. Booking variant becomes `Active / Checked In` and `Pending / In Progress`.

Pass real session metrics to `CyberConsoleLayout`:

```ts
sessionMetrics={{
  status: 'Live',
  avgResponse: '<1s',
  satisfaction: fm && fm.feedbackCount > 0
    ? `${((fm.avgRating / 5) * 100).toFixed(1)}%`
    : 'No data yet',
}}
```

### 3. `src/components/ai/chat/CyberConsoleLayout.tsx`

Change the fallback default so unpassed satisfaction renders `"No data yet"` instead of `"98.4%"`. Session status / avg response defaults stay as they are.

### 4. Consistency guardrail

Add a lightweight `console.assert` in `useFieldOpsMetrics` (dev only) confirming `jobsAssigned + jobsUnassigned === jobsActive` and `jobsPending + jobsInProgress <= jobsActive`. Keeps future regressions loud without shipping runtime UI.

## Out of scope

- Dispatch/GPS Console UI, Settings hub, Platform Dashboard, and other consoles' agent tiles.
- Any other place that already reads `useFieldOpsMetrics` keeps working because we retain the old field names as aliases.

## Verification

- On a tenant with 5 active jobs: Dispatch header shows `Active 5`, Tech Ops Assignment tile shows `Active 5 / Assigned N`, Routing tile shows `Pending X / In Progress Y` where `X + Y ≤ 5`.
- On an empty tenant or one with zero completed-today jobs and zero feedback rows: Satisfaction reads `No data yet` (not `98.4%`).
- Typecheck passes; existing tests for `useConsoleAgentMetrics` (if any) updated for renamed fields.
