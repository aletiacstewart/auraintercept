
# Plan: Add Smart Link Sharing to All Plans

## Overview
Add "Smart Link Sharing" as a feature row in the "See More Details" pricing comparison table, enabled for all 7 subscription tiers.

---

## Change Required

### File: `src/components/landing/PricingComparisonTable.tsx`

**Location**: "Platform Limits & Features" section (after line 155)

**Add new row**:
```typescript
{ name: 'Smart Link Sharing', express: 'check', flow: 'check', halo: 'check', core: 'check', singlePoint: 'check', multiTrack: 'check', command: 'check' }
```

---

## Result

The "Platform Limits & Features" section will show:
| Feature | All 7 Tiers |
|---------|-------------|
| Smart Link Sharing | ✓ |

This feature enables Aura to automatically share relevant business links (website, menu, booking, reviews) during conversations.

---

## Technical Details
Single line addition in `src/components/landing/PricingComparisonTable.tsx` at line 156.
