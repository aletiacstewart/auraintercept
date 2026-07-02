# Fix: auraintercept@gmail.com shows Free plan / Upgrade walls

## Root cause (two bugs stacked)

`auraintercept@gmail.com` holds **two** `user_roles` rows: `platform_admin` and `company_admin` (confirmed via DB). Company tier is `command`, trial ended 2026-02-13. Both platform_admin bypasses that should grant full access are broken:

**1. `supabase/functions/check-subscription/index.ts` (lines 155–159)**
```ts
.from('user_roles').select('role').eq('user_id', user.id).maybeSingle()
```
`.maybeSingle()` returns `null` when more than one row matches. Result: `userRole` is `undefined`, the `if (userRole === 'platform_admin')` bypass at line 164 is skipped, execution falls through to the Stripe branch and (with no active sub / Stripe hiccup) returns `subscribed: false` and often `tier: "free"` via the catch on line 369.

**2. `src/contexts/AuthContext.tsx` (lines 40–52, 215–220)**
`checkSubscription`'s useEffect depends only on `session?.access_token`, so it fires **once at login** while `userRole` is still `null` (roles load asynchronously via `setTimeout`→`fetchUserData`). The `userRole === 'platform_admin'` short-circuit at line 44 is therefore false on the first (and only, for 5 min) call, and the frontend hits the broken edge function. When `userRole` finally resolves, nothing re-invokes `checkSubscription`.

## Fix

**A. `supabase/functions/check-subscription/index.ts`** — replace the single-row role lookup with a multi-row query and prefer `platform_admin`:
```ts
const { data: rolesData } = await supabaseClient
  .from('user_roles')
  .select('role')
  .eq('user_id', user.id);
const roles = (rolesData ?? []).map(r => r.role);
const userRole = roles.includes('platform_admin') ? 'platform_admin'
  : roles.includes('company_admin') ? 'company_admin'
  : roles.includes('employee') ? 'employee'
  : roles.includes('customer') ? 'customer'
  : undefined;
```
Everything downstream (the `platform_admin` bypass, the employee/customer branch) already works once `userRole` is populated correctly. No other edge-function logic changes.

**B. `src/contexts/AuthContext.tsx`** — make the client platform_admin bypass fire as soon as the role resolves:
1. Add `userRole` to the subscription-check useEffect dependency array (line 220) so `checkSubscription` re-runs after `fetchUserData` finishes.
2. Keep the existing `userRole === 'platform_admin'` short-circuit — this becomes the durable frontend guarantee that admins never depend on the edge function at all.

## Out of scope
- Header "Current Plan" chip UI, subscription page, Stripe billing flows.
- Role-priority logic in `fetchUserData` (already correctly picks `platform_admin` first).
- No DB migrations; no changes to `user_roles` rows.

## Verification
- Log in as `auraintercept@gmail.com` → header shows Command/Elite, Business Management + all consoles render without "Upgrade Required".
- Log in as `ai@auraintercept.ai` → unchanged (single platform_admin row, bypass already fired; still bypasses).
- Log in as a real Free-tier company_admin → still sees upgrade gates (regression check).
