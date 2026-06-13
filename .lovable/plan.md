## Problem

While demoing or working inside dashboards/consoles, three separate things conspire to make the app:
- randomly reload the page mid-action, and
- briefly flash "Upgrade Required" cards on features the account actually has.

### Root causes found in the code

1. **`src/hooks/useDeploymentAutoReload.ts`** polls `/` every 20s and calls `window.location.reload()` whenever the built asset hash changes. In the Lovable preview, new bundles ship constantly, so this fires mid-demo. It also reloads on every `vite:ws:connect` HMR reconnect (very common in the preview iframe). The console logs `[DeploymentAutoReload] New deployment detected, reloading...` match exactly what the user is seeing.

2. **`src/hooks/useVisibilityRefresh.ts`** calls `queryClient.invalidateQueries()` (ALL queries) after the tab has been hidden ≥60s. That triggers a refetch storm: subscription, role, company, gating queries all go `pending` together, and any `FeatureGate` whose tier-check returns `false` during that brief window renders the "Upgrade Required" card. Once data resolves the page swaps again — looking like a "random refresh + upgrade pop-up."

3. **`src/components/subscription/FeatureGate.tsx` + `src/hooks/useSubscription.ts`** treat an unresolved subscription as `'free'`. `AuthContext` starts with `subscriptionTier = null`; `normalizeSubscriptionTier(null)` returns `'free'`; every gated console renders the upgrade card until `check-subscription` resolves (~½–1s on cold loads, longer after the invalidation storm above).

## Fix

Make all three layers demo-safe.

### 1. Tame the auto-reloader

`src/hooks/useDeploymentAutoReload.ts`:
- Suppress reloads when the user is **actively interacting** (mouse/keyboard within the last 30s) or has an open dialog/modal — defer until idle.
- Suppress reloads entirely for **demo sessions** (`user_metadata.aura_demo_trial === true`) and while a Super Switcher transition is in flight.
- Replace the unconditional `vite:ws:connect` `window.location.reload()` with the same idle/demo guard (preview-only HMR reconnect should not nuke a live demo).
- Keep the existing dedupe (`lastReloadedSignature`) so the reload only happens once per real deploy.

### 2. Narrow the visibility refresh

`src/hooks/useVisibilityRefresh.ts`:
- Replace blanket `queryClient.invalidateQueries()` with a targeted allow-list of safe-to-refresh keys (notifications, dashboard metrics, lists). Auth/subscription/role/company queries are explicitly excluded so gates do not re-flip to "free."
- Raise default threshold from 60s to 5 min and ignore the event when a modal/sheet is open.

### 3. Stop the upgrade flash

`src/components/subscription/FeatureGate.tsx`:
- Read `useAuth()` and, while `loading` is true **or** `subscriptionTier === null` (subscription check not back yet), render a lightweight skeleton (`<div className="h-32 animate-pulse rounded-md bg-muted/30" />`) instead of the Upgrade card.
- Same guard for `FeatureGateInline` — render the children dimmed (no upgrade hover) until tier is known.

`src/hooks/useSubscription.ts`:
- Expose a `tierLoaded` boolean (`authTier !== null`) so other call sites (e.g. `FeatureGate`) can wait for the first resolution before locking content.

### 4. Tiny supporting touch

`src/contexts/AuthContext.tsx`:
- No behavioral change; only ensure `subscriptionTier` stays `null` (not `'free'`) until `check-subscription` returns, so the new `tierLoaded` flag works correctly. (Already the case — verified.)

## Out of scope

- No changes to billing, Stripe, trial math, signup, leads form, or notification system.
- No changes to demo seeder, Super Switcher, or role priority logic.
- No new tables or migrations.

## Files touched

- `src/hooks/useDeploymentAutoReload.ts`
- `src/hooks/useVisibilityRefresh.ts`
- `src/components/subscription/FeatureGate.tsx`
- `src/hooks/useSubscription.ts`

## Verification

- Open `/dashboard` as a demo user, leave the tab for 5+ minutes, return — no auto-reload, no upgrade flash.
- Trigger an HMR reconnect in preview while a modal is open — no reload.
- Visit a console gated above the current tier — Upgrade card still shows (correct), but only after subscription resolves (no flash on tier-included consoles).
- Console no longer logs `New deployment detected, reloading...` mid-session.
