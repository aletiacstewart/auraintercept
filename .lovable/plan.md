
# Plan: Update Business Size Employee Counts

## Overview
Update the "Business Size" row in the pricing comparison table with new employee limits.

---

## Changes Required

### File: `src/components/landing/PricingComparisonTable.tsx` (Line 91)

**Current values:**
| Tier | Current Value |
|------|---------------|
| Express | Restaurants |
| Flow | Individual/Home |
| Halo | Salons & Spas |
| Core | 1-2 employees |
| Single-Point | 3-5 employees |
| Multi-Track | 6-10 employees |
| Command | 15+ technicians |

**New values:**
| Tier | New Value |
|------|-----------|
| Express | Single Restaurants |
| Flow | Individual/Home (unchanged) |
| Halo | Salons & Spas (unchanged) |
| Core | Up to 4 employees |
| Single-Point | Up to 8 employees |
| Multi-Track | Up to 16 employees |
| Command | Up to 32 technicians |

---

## Code Change

```typescript
// Line 91 - Update Business Size row
{ name: 'Business Size', express: 'Single Restaurants', flow: 'Individual/Home', halo: 'Salons & Spas', core: 'Up to 4 employees', singlePoint: 'Up to 8 employees', multiTrack: 'Up to 16 employees', command: 'Up to 32 technicians' }
```

---

## Technical Details
Single line modification at line 91 in `src/components/landing/PricingComparisonTable.tsx`.
