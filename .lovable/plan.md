

# Remove "Predictive AI Hub" from Pricing UI

## Changes (3 files)

### 1. `src/pages/Index.tsx`
- **Line 909**: Change description from "All 24 Smart AI Agents with Predictive AI Hub." → "All 24 Smart AI Agents with full-suite automation."
- **Line 913**: Remove the entire "Predictive AI Hub" bullet point from the Elite card's feature list

### 2. `src/components/landing/PricingComparisonTable.tsx`
- **Line 103**: Remove the `{ name: 'Predictive AI Hub', ... }` row from the comparison grid
- **Lines 36**: Remove the `'Predictive AI Hub'` tooltip entry from the descriptions object

### 3. `src/pages/Subscription.tsx`
- **Line 145**: Remove `'Predictive AI Hub'` from the Elite tier highlights array
- **Line 59**: Remove the `'Predictive AI Hub'` tooltip description entry

No other files affected — the Help.tsx and PDF references describe Elite features in paragraph form and don't need changes for this UI-focused removal.

