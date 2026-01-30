
# Fix Live Preview Refresh Issues

## Problem Analysis

Two issues were identified from the console logs:

1. **Vite Server Connection Lost** (`[vite] server connection lost. Polling for restart...`)
   - This is a transient network issue between the Lovable preview iframe and the Vite dev server
   - The existing `useDeploymentAutoReload` hook should handle this, but may need improvement

2. **PublicFooter Ref Warning** (non-critical)
   - React warns that `PublicFooter` is receiving a ref without `forwardRef`
   - This is a minor warning and doesn't directly affect refresh behavior

---

## Solution

### 1. Improve Deployment Auto-Reload Reliability

Update `src/hooks/useDeploymentAutoReload.ts` to:
- Add a dedicated handler for Vite HMR reconnection
- Force page reload after vite reconnects to ensure fresh content
- Add a fallback mechanism when connection is lost for extended periods

### 2. Fix PublicFooter forwardRef Warning

Update `src/components/layout/PublicFooter.tsx` to:
- Wrap the component with `React.forwardRef`
- This ensures proper ref forwarding if any parent component passes a ref

---

## Technical Details

### useDeploymentAutoReload.ts Changes

```typescript
// Add Vite HMR reconnection handling
useEffect(() => {
  // Listen for vite reconnection events
  const handleViteReconnect = () => {
    console.log('[DeploymentAutoReload] Vite reconnected, checking for updates...');
    // Force a check after reconnection
    checkForUpdate();
  };

  // Vite injects this event when HMR reconnects
  if (import.meta.hot) {
    import.meta.hot.on('vite:ws:connect', handleViteReconnect);
  }

  return () => {
    if (import.meta.hot) {
      import.meta.hot.off('vite:ws:connect', handleViteReconnect);
    }
  };
}, []);
```

### PublicFooter.tsx Changes

```typescript
import { forwardRef, useState } from 'react';

export const PublicFooter = forwardRef<HTMLDivElement>((_, ref) => {
  // ... existing component logic
  return (
    <footer ref={ref} ...>
      {/* existing content */}
    </footer>
  );
});

PublicFooter.displayName = 'PublicFooter';
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/hooks/useDeploymentAutoReload.ts` | Add Vite HMR reconnection handler |
| `src/components/layout/PublicFooter.tsx` | Wrap with `forwardRef` |

---

## Expected Outcome

After these changes:
- The preview will automatically refresh when Vite reconnects after losing connection
- The React ref warning will be resolved
- Build updates will be detected more reliably in the Lovable preview iframe
