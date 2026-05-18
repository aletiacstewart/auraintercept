# Fix: Console links disappear on demo dashboards

## What's happening

On the demo dashboard screenshot you sent, the top chip reads **"CURRENT PLAN: FREE"** and the sidebar is missing every console link (Customer Portal, Technician/Stylist View, Business Management, Analytics & Reports, Specialist Operatives, Outreach & Sales, Social Media).

Those links are gated by tier in `src/components/dashboard/DashboardLayout.tsx`:

```
Customer Portal        requiredTier: 'starter'
Technician View        requiredTier: 'connect'
Business Management    requiredTier: 'performance'
Analytics & Reports    requiredTier: 'command'
Specialist Operatives  requiredTier: 'performance'
Outreach & Sales       requiredTier: 'starter'
Social Media           requiredTier: 'connect'
```

The filter calls `isAtLeastTier(...)`. When the resolved tier is `'free'`, every one of those items is removed and the whole "Workspaces / AI Consoles" group collapses (the group only renders if `items.length > 0`), which is exactly the symptom.

## Why the tier is resolving to "free"

The Demo Salon & Spa company in the DB is correctly set up:

- `companies.subscription_tier = 'starter'`
- `companies.trial_ends_at = 2026-06-07` (active trial)
- The demo admin's `profiles.company_id` points at the demo company
- `user_roles.role = 'company_admin'`

So `check-subscription` should return `tier: 'starter'`, `in_trial: true`. But the UI is rendering "FREE" with no trial chip — meaning `AuthContext.subscriptionTier` is sitting at `'free'` and `inTrial` is `false`.

That happens in two real scenarios for demo dashboards:

1. **Platform admin viewing a demo via Super Switcher.** The signed-in user is `ai@auraintercept.ai`. `check-subscription` short-circuits at the `platform_admin` branch and returns `tier: 'command'` — but only after the first successful call. Until then (and after a refresh on the demo URL where the session token isn't ready), the chip flashes `'free'` and the sidebar renders empty. The platform_admin branch is fine; the issue is the no-token early-exit path returns `tier: "free"`.
2. **Demo trial users (`demo-admin-*@auraintercept.ai`)** where `check-subscription` early-exits with `tier: "free"` because `getClaims`/`getUser` failed once, or where `is_demo = true` companies aren't being recognized as automatically full-access for preview purposes.

In both cases the sidebar permanently hides the consoles for the rest of the session, because nothing re-fires `checkSubscription` after the token settles, and the filter has no "demo company" override.

## The fix

Two small, surgical changes — no schema work, no new tables.

### 1. Treat any `is_demo` company as a full-preview tier in `check-subscription`

`supabase/functions/check-subscription/index.ts`

- After fetching `companyData`, if `companyData.is_demo === true`, return immediately:
  ```
  subscribed: true,
  tier: 'command',
  in_trial: true,
  trial_ends_at: companyData.trial_ends_at,
  ```
- Add `is_demo` to the `companies` select list.
- This guarantees every demo dashboard — whether viewed by the seeded demo admin, a Super-Switcher impersonator, or a brand-new 24-hour trial — sees the full console set, which is the entire point of the demo.

### 2. Stop the "free flash" in the sidebar before subscription resolves

`src/components/dashboard/DashboardLayout.tsx`

- Pull `subscriptionTier` from `useSubscription()` and, while it is still `null` (initial load) **or** while `is_demo` company is detected via `useWorkspace()/useIndustryPack` company metadata, skip tier filtering on the AI console items (treat them as visible).
- Concretely: change the filter to `if (item.requiredTier && subscriptionTier && !isAtLeastTier(item.requiredTier)) return false;` so an unresolved tier doesn't hide everything.
- Mirror the same guard at the group level (`group.requiredTier`).

This eliminates the "links briefly appear, then vanish" behavior and is also the correct behavior generally — we shouldn't hide nav based on a not-yet-known tier.

### 3. (Optional polish) Force a re-check after Super Switcher hop

`src/hooks/useSuperSwitcher.ts` already dispatches `super-switcher:switching`. In `AuthContext`, listen for that event and call `checkSubscription()` once the new session settles. One-liner safety net so the chip and sidebar refresh together after impersonating into a demo.

## Out of scope

- No changes to pricing tiers, trial length, demo seeding, or RLS.
- No new database columns; `companies.is_demo` already exists.
- No UI redesign of the sidebar.

## How we'll verify

1. Load `/dashboard` on the Demo Salon & Spa account → chip shows `Starter` (or `Command` after the demo override) and the AI Consoles group renders all 7 links.
2. Super-Switcher hop into another demo industry (e.g. Plumbing, Home Health) → consoles stay visible, no flash to empty sidebar.
3. Non-demo Free signup → sidebar still correctly hides the gated consoles (regression check).
