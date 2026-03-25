
## Fix: Homepage Crash — Invalid Tooltip Wrapping Table Row

### Root Cause

In `PricingComparisonTable.tsx` lines 408–421, each `<tr>` is wrapped in `<Tooltip>`:

```text
<tbody>
  <React.Fragment>
    <tr>...</tr>     ← section header
    <Tooltip>        ← THIS IS THE BUG — Tooltip renders a <div>, invalid inside <tbody>
      <tr>...</tr>   ← feature row
    </Tooltip>
  </React.Fragment>
</tbody>
```

The Radix UI `<Tooltip>` component renders wrapper DOM elements that cannot appear between `<tbody>` and `<tr>`. This is invalid HTML and causes a React crash that prevents the entire homepage from rendering.

The tooltip functionality for individual feature names is already correctly implemented inside `FeatureNameCell` using `TooltipTrigger` and `TooltipContent` — the outer `<Tooltip>` wrapper on the row is redundant AND breaking.

### Fix

**`src/components/landing/PricingComparisonTable.tsx`** (lines 408–421)

Remove the `<Tooltip key={feature.name}>` wrapper and move the `key` directly onto the `<tr>`:

Before:
```tsx
return (
  <Tooltip key={feature.name}>
    <tr className={...}>
      ...
    </tr>
  </Tooltip>
);
```

After:
```tsx
return (
  <tr key={feature.name} className={...}>
    ...
  </tr>
);
```

### Files
- `src/components/landing/PricingComparisonTable.tsx` — remove `<Tooltip>` wrapper around `<tr>` (lines 408–421)
