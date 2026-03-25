
## Root Cause Analysis

The site is completely blank. After deep inspection, there are **three stale files** that still define the old 8-tier `SubscriptionTier` type and reference legacy keys that no longer exist in `TIER_AGENT_CONFIG`. When the build evaluates these type exports and runtime values, TypeScript/Vite throws a compile-time or module-resolution error that prevents the entire app from loading.

### The three broken files:

**1. `src/contexts/AuthContext.tsx` (line 7)**
```ts
// BROKEN — still exports the old 8-tier type
export type SubscriptionTier = 'free' | 'express' | 'aura_flow' | 'halo' | 'core' | 'single_point' | 'multi_track' | 'command';
```
This creates a **named export conflict** — anything importing `SubscriptionTier` from `AuthContext` gets the wrong type.

**2. `src/lib/customerPortalConfig.ts` (line 15)**
```ts
// BROKEN — still defines and uses the old 8-tier type
export type SubscriptionTier = 'free' | 'express' | 'aura_flow' | 'halo' | 'core' | 'single_point' | 'multi_track' | 'command';
const PORTAL_ACCESS_TIERS: SubscriptionTier[] = ['halo', 'single_point', 'multi_track', 'command'];
const ONLINE_BOOKING_TIERS: SubscriptionTier[] = ['halo', 'multi_track', 'command'];
```
The `CustomerChatInterface.tsx` imports `SubscriptionTier` from here and uses `subscriptionTier = 'single_point'` as a default prop — a value that now causes type errors.

**3. `src/components/chat/CustomerChatInterface.tsx` (line 75)**
```ts
subscriptionTier = 'single_point',  // 'single_point' is not a valid tier anymore
```

## Fixes

### Fix 1: `src/contexts/AuthContext.tsx`
- Line 7: Replace the local `SubscriptionTier` type definition with a re-export from `subscriptionAgentConfig.ts`
```ts
// Remove old type
// Add import:
import { SubscriptionTier, normalizeTierName } from '@/lib/subscriptionAgentConfig';
export type { SubscriptionTier };
```

### Fix 2: `src/lib/customerPortalConfig.ts`
- Line 15: Remove the local `SubscriptionTier` type definition and import from `subscriptionAgentConfig.ts`
- Lines 120-123: Update `PORTAL_ACCESS_TIERS` and `ONLINE_BOOKING_TIERS` to use the canonical tier names (`connect`, `performance`, `command`, etc.)

### Fix 3: `src/components/chat/CustomerChatInterface.tsx`
- Line 75: Change the default prop from `'single_point'` to `'connect'` (the entry-level canonical tier)

## Files to Change
- `src/contexts/AuthContext.tsx` — remove old SubscriptionTier type, re-export from subscriptionAgentConfig
- `src/lib/customerPortalConfig.ts` — remove old SubscriptionTier type, fix tier arrays to use canonical names
- `src/components/chat/CustomerChatInterface.tsx` — fix default prop from `'single_point'` to `'connect'`
