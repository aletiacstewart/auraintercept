
## Root Cause

`FeatureNameCell` renders `<TooltipTrigger>` and `<TooltipContent>` directly inside a `<td>`, but there is no parent `<Tooltip>` wrapper per row. The `<Tooltip>` wrapper that *was* around each `<tr>` was removed in the previous fix (because it broke table DOM structure). Now `TooltipTrigger` has no `<Tooltip>` context, which throws a React error that crashes the entire page.

The fix is to wrap `<TooltipTrigger>` + `<TooltipContent>` inside a `<Tooltip>` **within** `FeatureNameCell` itself — keeping it inside the `<td>` where it's DOM-valid.

At the same time, the comparison table header still shows 7 legacy columns. These should be trimmed to 3 (Connect, Performance, Command) to match the pricing cards above it.

## Changes

### `src/components/landing/PricingComparisonTable.tsx`

**1. Fix `FeatureNameCell` (lines 272–296):** Add `<Tooltip>` wrapper inside the cell around `<TooltipTrigger>` + `<TooltipContent>`:

```tsx
// Before (broken — no <Tooltip> context):
<td>
  <TooltipTrigger>...</TooltipTrigger>
  <TooltipContent>...</TooltipContent>
</td>

// After (correct — <Tooltip> wraps the trigger+content inside the <td>):
<td>
  <Tooltip>
    <TooltipTrigger>...</TooltipTrigger>
    <TooltipContent>...</TooltipContent>
  </Tooltip>
</td>
```

**2. Add `Tooltip` to imports (line 3–7):** Import `Tooltip` from `@/components/ui/tooltip`.

**3. Trim to 3 columns (lines 78–203, 298–427):** 
- Update `FeatureRow` interface to remove `starter`, `scheduling`, `growth`, `business`, `fieldOps` fields — keep only `connect`, `performance`, `command`
- Update all `sections` data rows accordingly
- Update table header (`<thead>`) to show only 3 columns: Aura Connect, Aura Performance, Aura Command
- Update `colgroup` to 4 columns (feature name + 3 plan columns)
- Update `renderValue` calls in the row render to only pass `connect`, `performance`, `command`
- Update section title numbers (e.g. "AI Agents (1 / 3 / 11 / 12 / 18 / 22 / 24)" → "(5 / 7 / 10)")

This is a single-file fix that resolves the crash and modernizes the table to match the 3-tier model.
