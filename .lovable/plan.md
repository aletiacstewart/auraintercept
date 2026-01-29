

# Fix: Live Preview Not Updating Without User Interaction

## Problem Summary

The Lovable preview iframe doesn't automatically show the latest changes after code is deployed. You need to interact with the chat (send a message) or manually refresh to see updates.

This happens because:
1. **React Query caches data** - Data is cached and not refetched until you interact with the page
2. **No automatic reload mechanism** - The preview doesn't detect when builds complete
3. **Static iframe key** - The preview iframe uses a fixed key, so it doesn't force re-render

---

## Solution Overview

Implement a multi-layered approach to ensure the preview stays fresh:

| Layer | What It Does |
|-------|--------------|
| **1. Reduce cache staleness** | Lower React Query's default stale time so data refreshes sooner |
| **2. Add window focus refetch** | Auto-refetch data when you click back into the preview |
| **3. Add visibility refetch** | Refetch when the tab becomes visible |
| **4. Smart iframe key** | Add a timestamp-based key to force iframe reload on navigation |

---

## Technical Implementation

### 1. Configure React Query Defaults (src/App.tsx)

Update the QueryClient to have shorter stale times and enable automatic refetching:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // Data is fresh for 30 seconds
      gcTime: 5 * 60 * 1000, // Garbage collect after 5 minutes
      refetchOnWindowFocus: true, // Refetch when window gets focus
      refetchOnReconnect: true, // Refetch on network reconnect
      retry: 1, // Retry failed requests once
    },
  },
});
```

**Why this helps**: When you interact with the preview (click, scroll, etc.), queries will automatically refresh if data is older than 30 seconds.

### 2. Add Visibility-Based Reload Hook (new file)

Create a hook that detects when the page becomes visible and triggers a refresh:

**File**: `src/hooks/useVisibilityRefresh.ts`

```typescript
// Detects when preview tab becomes visible
// Triggers a soft refresh of stale data
```

This hook will:
- Listen for `visibilitychange` events
- Track time since last refresh
- Invalidate stale queries when the tab becomes visible after being hidden for >60 seconds

### 3. Integrate Auto-Refresh in App.tsx

Add the visibility refresh hook to the App component so it runs globally.

### 4. Fix WidgetPreview Iframe Key

Update the iframe to use a dynamic key that changes when needed:

**File**: `src/components/widget/WidgetPreview.tsx`

```typescript
// Add a state to track iframe refresh
const [iframeKey, setIframeKey] = useState(Date.now());

// Add a refresh button
<Button onClick={() => setIframeKey(Date.now())}>
  Refresh Preview
</Button>

<iframe
  key={`widget-preview-${iframeKey}`}
  src={`/chat/${companySlug}?embed=true&v=${iframeKey}`}
  ...
/>
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/hooks/useVisibilityRefresh.ts` | Hook to detect visibility changes and refresh data |

## Files to Modify

| File | Changes |
|------|---------|
| `src/App.tsx` | Configure QueryClient with auto-refresh options, add visibility hook |
| `src/components/widget/WidgetPreview.tsx` | Add manual refresh button and dynamic iframe key |

---

## How It Works

```text
┌─────────────────────────────────────────────────────────────┐
│                   Lovable Makes Changes                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Code Deploys to Preview                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│     User Clicks/Focuses Preview Window                       │
│     ┌─────────────────────────────────────────────────────┐ │
│     │  refetchOnWindowFocus: true  →  Queries Refetch     │ │
│     └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Fresh Data Displayed                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Expected Behavior After Fix

1. **Click into preview** → Data auto-refreshes if stale (>30s old)
2. **Switch tabs back** → Data auto-refreshes if hidden for >60s
3. **Manual refresh button** → Available in WidgetPreview for force reload
4. **Network reconnect** → Data auto-refreshes

---

## Alternative: Force Hard Refresh

For cases where even this isn't enough, the existing "Force Refresh" button in Settings → System can be used to clear all caches completely.

---

## Summary

| Change | Benefit |
|--------|---------|
| `staleTime: 30s` | Data refreshes more frequently |
| `refetchOnWindowFocus: true` | Auto-refresh on click into preview |
| `refetchOnReconnect: true` | Auto-refresh after network issues |
| Visibility hook | Refresh after tab switching |
| Dynamic iframe key | Force iframe reload when needed |

This ensures the preview stays up-to-date without requiring manual interaction with the chat.

