
# Plan: Remove Follow-up Agent from Aura Flow

## Change Summary
Remove the Follow-up Agent from Aura Flow tier since it's not needed for a personal assistant use case.

## File to Modify

### `src/components/landing/PricingComparisonTable.tsx` (Line 100)

Change:
```typescript
{ name: 'Follow-up Agent', express: 'x', flow: 'check', halo: 'check', core: 'x', singlePoint: 'check', multiTrack: 'check', command: 'check' }
```

To:
```typescript
{ name: 'Follow-up Agent', express: 'x', flow: 'x', halo: 'check', core: 'x', singlePoint: 'check', multiTrack: 'check', command: 'check' }
```

## Result
- Aura Flow will show ✗ instead of ✓ for Follow-up Agent
- Aura Flow agents reduced from 3 to 2: AI Receptionist + Scheduling Agent

---

## Technical Details
Single property change: `flow: 'check'` → `flow: 'x'` on line 100
