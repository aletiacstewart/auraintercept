
# Plan: Enable White-Label Branding for All Tiers

## Current State
The "White-Label Branding" row in the pricing comparison table currently shows:
- Express: ✗
- Halo: ✗
- Core: ✗
- Single-Point: ✗
- Multi-Track: ✗
- Command: ✓ (only tier with checkmark)

## Required Change
Update the row to show checkmarks (✓) for **all tiers**.

## Files to Modify

### 1. `src/components/landing/PricingComparisonTable.tsx` (Line 153)
Change the White-Label Branding row from:
```typescript
{ name: 'White-Label Branding', express: 'x', halo: 'x', core: 'x', singlePoint: 'x', multiTrack: 'x', command: 'check' }
```
To:
```typescript
{ name: 'White-Label Branding', express: 'check', halo: 'check', core: 'check', singlePoint: 'check', multiTrack: 'check', command: 'check' }
```

### 2. `src/pages/Subscription.tsx` (Line 284)
Change the White-Label Branding row from:
```typescript
{ name: 'White-Label Branding', core: 'x', singlePoint: 'x', multiTrack: 'x', command: 'check' }
```
To:
```typescript
{ name: 'White-Label Branding', core: 'check', singlePoint: 'check', multiTrack: 'check', command: 'check' }
```

## Result
All subscription tiers will display a green checkmark (✓) for White-Label Branding in both the landing page and subscription page comparison tables.
