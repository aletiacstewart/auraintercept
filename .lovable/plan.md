
## Fix: Homepage Not Loading

### Root Cause

`PricingComparisonTable.tsx` (line 364) uses bare `<>...</>` shorthand fragments inside a `.map()`. Shorthand fragments cannot accept a `key` prop — React requires the outermost element in any list render to have a unique `key`. The `key` is currently placed on the inner `<tr>` (two levels deep), not on the fragment wrapper. This causes a React crash that bubbles up and prevents the entire homepage from rendering.

### Fix

In `src/components/landing/PricingComparisonTable.tsx`, replace the bare `<>` shorthand fragment with `<React.Fragment key={section.title}>` so the key is on the outermost element of the map.

### Files to change

**`src/components/landing/PricingComparisonTable.tsx`** (line ~364)
- Add `import React from 'react'` at the top
- Change `<>` → `<React.Fragment key={section.title}>` and `</>` → `</React.Fragment>` in the `sections.map()` callback
