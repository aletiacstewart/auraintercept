## Goal

A single **super-admin login** (`superadmin@auraintercept.ai` / chosen password) that lands on a **Switcher Hub** page. The hub has:

- **Industry dropdown** at top (all 24 seeded industries, e.g. "hvac — Demo HVAC Co").
- A grid of cards (or a single focused card for the selected industry) with three buttons: **Company**, **Employee**, **Customer**.
- Clicking a button swaps the active session into that demo user and lands on their dashboard (`/dashboard`, `/technician`, `/customer-portal`) — **same tab, no manual re-login**.
- A persistent **"Switcher" pill** in the header of every demo dashboard so you can jump back to the hub or switch role/industry instantly.

This mirrors the AdultLeague Super Switcher Hub UX exactly, mapped onto our 24 industries × 3 roles (= 72 demo accounts already seeded by `seed-demo-accounts-v2`).

## How the in-tab swap works

To avoid logout/login friction, the swap reuses the existing demo passwords (all 72 accounts share `aidemo*!`):

1. User clicks **Company** on the "hvac" card.
2. Client calls `supabase.auth.signOut()` then `supabase.auth.signInWithPassword({ email: 'hvacadmin@demo.com', password: 'aidemo*!' })`.
3. On success, `localStorage.setItem('aura_super_admin', '1')` is set so the app knows this session is "owned" by the super-admin (shows the Switcher pill in the header, hides Sign Out → replaces with "Back to Switcher").
4. Router pushes to `/dashboard` (admin), `/technician` (employee), or `/customer-portal` (customer).

"Back to Switcher" signs out, signs back in as `superadmin@auraintercept.ai`, and routes to `/super-switcher`.

This is safe because:
- The super-admin password lives only in the edge function (never in client code).
- All demo passwords are already public knowledge in our docs.
- Only `platform_admin` can hit the bootstrap edge function that creates/repairs the super-admin user.

## What gets built

### 1. Super-admin user
- New auth user `superadmin@auraintercept.ai` with `platform_admin` role.
- Created/repaired by a one-shot edge function `seed-super-admin` (platform_admin gated). Password set via a Lovable secret `SUPER_ADMIN_PASSWORD`.

### 2. Switcher Hub page — `/super-switcher`
- Route gated to `platform_admin` role.
- Header: "Super Switcher Hub — One demo login, every industry, every console."
- Top bar: industry `<Select>` (24 options, shows industry label + tier badge), persists last choice in localStorage.
- Below: 24 cards (grouped by cluster: Field Services / Home Services / Healthcare / Specialty), each with:
  - Industry name, city/region (from seeded company), tier chip, LIVE/SEEDED badge.
  - Three buttons: **Company**, **Employee**, **Customer**.
  - Footer chips: "Live console", "Public page" (links to public booking), "Standings" → reuse existing analytics link.
- Filter input to narrow the grid.

### 3. Switcher pill (header injection)
- Small pill component rendered in `DashboardLayout`, `TechnicianLayout`, and `CustomerPortalHome` headers when `localStorage.aura_super_admin === '1'`.
- Shows: current industry + role, dropdown to switch role within same industry, "← All industries" button (back to `/super-switcher`).

### 4. Hook `useSuperSwitcher`
- `enter(industryKey, role)` → signs out, signs in as the demo user, sets flag, routes.
- `exit()` → signs out, signs back in as super-admin, routes to `/super-switcher`.
- `current()` → derives `{ industry, role }` from the signed-in email pattern.

### 5. Auth flow tweak
- `Auth.tsx` `handleSignIn`: if email = `superadmin@auraintercept.ai` AND user has `platform_admin` role, redirect to `/super-switcher` instead of `/dashboard`.

### 6. Files
- `supabase/functions/seed-super-admin/index.ts` (new, platform_admin gated, uses `SUPER_ADMIN_PASSWORD` secret).
- `src/pages/SuperSwitcher.tsx` (new).
- `src/components/super-switcher/SwitcherPill.tsx` (new) — injected into the 3 layouts.
- `src/hooks/useSuperSwitcher.ts` (new).
- `src/App.tsx` — register `/super-switcher` route.
- `src/pages/Auth.tsx` — redirect rule for super-admin email.
- `src/components/dashboard/DashboardLayout.tsx`, technician/customer layouts — render `<SwitcherPill />` when flag is set.
- Memory: update `mem://platform-operations/demo-account-registry` with the super-admin entry + switcher URL.

## Out of scope

- No new seed data — uses the existing 72 demo users.
- No multi-tab session juggling — single tab, sequential signin/signout.
- No change to non-demo company behavior.

## Confirmations needed before I build

1. **Email + password**: OK to use `superadmin@auraintercept.ai`? You'll need to add a `SUPER_ADMIN_PASSWORD` secret (I'll prompt when implementing).
2. **In-tab signout/signin swap is acceptable** (1–2s flash, no manual re-login). If you'd rather see zero flash, we can do magiclink-in-new-tab instead — but it won't match the AdultLeague feel.
