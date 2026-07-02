## What happened

The Super Admin Switcher Hub you built on May 8 (`/super-switcher`, `SwitcherPill`, `useSuperSwitcher`, `seed-super-admin` edge function, Auth.tsx entry point) is no longer in the codebase. `rg` finds zero references anywhere in `src/` or `supabase/functions/`. It was removed at some point after May 8 — most likely collateral damage from one of these later sweeps:

- Sidebar simplification v1 (hid non-core routes)
- Power-user pages restricted to `platform_admin` (design-preview, architecture, calculators, etc.)
- Canonical naming refactor (touched many console entry points)

The 78 demo accounts themselves still exist in the demo registry (`aidemo*!`, reseedable at `/dashboard/demo-seeder`), so only the *hub UI* is missing — no data was lost.

## Plan to restore

### 1. Route + page
- Add `src/pages/SuperSwitcher.tsx` — the grid hub: 26 industries × 3 roles (admin / employee / customer), each a card that opens the demo session in a **new tab via magic link** (the behavior you originally approved).
- Register `/super-switcher` in `src/App.tsx`, gated to `platform_admin` only (uses the existing `useUserRole` hook with a loading gate to avoid the flash-of-unauthorized issue).

### 2. Hook
- `src/hooks/useSuperSwitcher.ts` — calls the `seed-super-admin` edge function to mint a magic link for `{industry}{role}@demo.com`, returns `{ openSession(industry, role) }`.

### 3. Edge function
- Restore `supabase/functions/seed-super-admin/index.ts` — verifies the caller is `platform_admin`, uses service-role to generate a magic link for the target demo account, returns the URL. `verify_jwt = true` (this one is admin-only, not a public bypass).

### 4. Entry points
- `SwitcherPill` component in the Platform Admin dashboard header (visible only to `platform_admin`) linking to `/super-switcher`.
- Add a sidebar entry under the Platform Admin group.

### 5. Guardrails
- Hide demo companies from non-admin dropdowns is already in place (`is_demo` column + `list_companies_public` RPC filter from the earlier sweep) — nothing to change there.
- Loading-state gate on the page (spinner while `useAuth` + `useUserRole` resolve) so it never flashes "Access Denied".

## Files to add / edit

- **add** `src/pages/SuperSwitcher.tsx`
- **add** `src/hooks/useSuperSwitcher.ts`
- **add** `src/components/admin/SwitcherPill.tsx`
- **add** `supabase/functions/seed-super-admin/index.ts` + `config.toml` entry
- **edit** `src/App.tsx` (route registration, platform_admin gate)
- **edit** the Platform Admin dashboard header + sidebar to surface the pill/link

## Out of scope

- No changes to the demo account registry or seeder (already working).
- No changes to pricing, canonical names, or any of the recent voice-and-style work.
- No new secrets needed — `SUPER_ADMIN_PASSWORD` was already added on May 8 and remains in the secret store.

## Verification

- Sign in as `ai@auraintercept.ai`, confirm the pill appears and `/super-switcher` renders the 78 cards.
- Click one card → new tab opens signed in as that demo user.
- Sign in as a non-admin, confirm `/super-switcher` is not reachable and no flash of the hub UI.
