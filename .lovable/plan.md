
## Root Cause

**React Rules of Hooks violation (Error #310)** in `AIAgentConsole.tsx`.

The component has an early return at line 557:
```tsx
if (showCompanySelector) {
  return (<Card>...<CompanySelector /></Card>);
}
```

This early return happens **after** some hooks but **before** the `useQuery` for `agentConfigs`, `company`, `services`, `businessHours`, and `featureFlags` — meaning React renders a different number of hooks between the "selector shown" and "company selected" states. When a user selects a company, React crashes with Error #310.

## Fix

Move the early `if (showCompanySelector) return (...)` block to **after all hooks have been called**, not before them. Specifically:

1. All `useQuery` hooks (lines 149–260) run unconditionally (with `enabled: !!companyId` guards — already correct).
2. The `sessionStats` `useMemo` at line 570 is currently **after** the early return, meaning it's only called when a company is selected. Move it before the early return check.
3. The `agentInfo`, `getActiveLabel`, and `activeLabel` computations at lines 524–542 are also after the early return — move them before too.

Essentially, **all hooks and derived state** need to be declared before any conditional `return` statement.

## Implementation Steps

1. **Move the early return** for `showCompanySelector` (lines 557–567) to after ALL hooks and computed values (after line 574).
2. Move `sessionStats` useMemo (lines 570–574) to before the `showCompanySelector` early return.
3. Ensure `agentInfo`, `getActiveLabel`, and `activeLabel` (lines 524–542) remain before the early return (they already are — confirmed at line 524, good).
4. The `showCompanySelector` check at line 545 and `handleCompanySelect`/`handleBackToCompanySelector` handlers at 547–555 are already before the early return — no change needed.

## Files to Change

- `src/components/ai/AIAgentConsole.tsx` — move `sessionStats` useMemo before the early `showCompanySelector` return block, and move the early return to after line 574.
