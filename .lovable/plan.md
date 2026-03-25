
## Root Cause

`TierComparisonCards.tsx` uses these tier keys when calling `TIER_AGENT_CONFIG[tier]`:
- `'express'`, `'aura_flow'`, `'halo'`, `'core'`, `'single_point'`, `'multi_track'`, `'command'`

But `TIER_AGENT_CONFIG` only has: `free`, `connect`, `growth`, `field_ops`, `performance`, `command`.

The legacy keys (`express`, `aura_flow`, `halo`, `core`, `single_point`, `multi_track`) do **not exist** in the config — they are only listed in `LEGACY_TIER_MAP`. So `TIER_AGENT_CONFIG['express']` returns `undefined`, and `config.label` throws a crash that the `ErrorBoundary` catches, showing a blank screen for **every page**.

## Fix

`src/components/agents/TierComparisonCards.tsx` — rework the component to use only the 3 real current tiers: `connect`, `performance`, `command`. Remove the "Industry-Specific" and old "General Business" tier grid. Show the 3-tier model with the correct keys that actually exist in `TIER_AGENT_CONFIG`.

The `TierCard` component's `tier` prop type must also be updated from the stale union (that includes `express`, `aura_flow`, etc.) to the canonical `SubscriptionTier` type from `subscriptionAgentConfig.ts`.

## Changes

**`src/components/agents/TierComparisonCards.tsx`** (single file, full rewrite of tiers rendered):
- Change `tier` prop type on `TierCard` from `'express' | 'aura_flow' | 'halo' | 'core' | 'single_point' | 'multi_track' | 'command'` → `SubscriptionTier` (imported from `@/lib/subscriptionAgentConfig`)
- Remove the "Industry-Specific Tiers" section (express, aura_flow, halo — all invalid keys)
- Remove the old "General Business Tiers" section (core, single_point, multi_track — all invalid keys)
- Replace with a clean 3-column grid using only `connect`, `performance`, `command` — which are valid keys in `TIER_AGENT_CONFIG`
- Update the "Upgrade Summary" strip at the bottom to match the 3-tier model ($297 → $497 → $697)

This is a single-file fix that immediately unblocks the crash and restores the entire platform.
