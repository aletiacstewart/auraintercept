# Sales-Rep Demo Logins for Super Switcher

Add three demo-only logins for Aura sales reps that can use the Super Switcher Hub to demo any industry, but cannot edit platform settings, run seeders, or reach platform-admin pages.

## Accounts to create

| Email | Password | Role |
|---|---|---|
| `michael@auraintercept.ai` | `aidemo*!` | `demo_rep` |
| `charles@auraintercept.ai` | `aidemo*!` | `demo_rep` |
| `ryelee@auraintercept.ai` | `aidemo*!` | `demo_rep` |

Email auto-confirmed. No `companies` row, no `profiles` company link — these accounts only exist to enter the Super Switcher and impersonate the existing demo tenants.

## Changes

### 1. Database (migration)
- Add `'demo_rep'` value to `public.app_role` enum.
- No new tables; reuse `user_roles`.

### 2. Edge function — `seed-sales-rep-accounts`
One-shot, idempotent, service-role:
- For each of the 3 emails: find user via `admin.listUsers`; if missing, `admin.createUser({ email, password, email_confirm: true })`; if present, `admin.updateUserById({ password, email_confirm: true })`.
- Upsert `user_roles (user_id, role='demo_rep')`.
- Returns `{ ok, created: [...], updated: [...] }`.
- Allow-list the 3 emails inside the function (same pattern as `admin-reset-password`).
- Invoked once from the Super Switcher page by an existing platform_admin via a small "Provision sales-rep logins" button (kept in the existing header toolbar, hidden from `demo_rep`).

### 3. Gating

`src/pages/SuperSwitcher.tsx`
- Allow access when `userRole === 'platform_admin' || userRole === 'demo_rep'`.
- Hide platform-admin-only controls from `demo_rep`:
  - "Seed / repair all demos" button
  - "Demo seeder console" link
  - "Provision sales-rep logins" button

`src/hooks/useSuperSwitcher.ts`
- `enter()`: stash current session when email is `SUPER_ADMIN_EMAIL` **or** belongs to `SALES_REP_EMAILS` (new exported `Set`). This way `exit()` restores the rep session instead of bouncing to `/auth`.
- No change to switched-in behavior — reps land in the demo tenant as `company_admin`/`employee`/`customer` and can edit demo data freely (answer to Q3).

`src/contexts/AuthContext.tsx` (or a new top-level `<DemoRepGuard>` mounted in `App.tsx`)
- When `userRole === 'demo_rep'` AND no active switch (`!isSuperSwitcherActive()`) AND current path is not `/super-switcher` or `/auth`, `Navigate` to `/super-switcher`.
- Post-login redirect for `demo_rep` → `/super-switcher` (update the existing post-login routing logic that currently sends `platform_admin` → `/super-switcher`).

### 4. Sign-out / exit
`useSuperSwitcher.exit()` already restores the stashed session — with the change above, reps will be restored to their `demo_rep` session and land back on `/super-switcher`. Header "Sign out" button works as-is.

## Out of scope
- No changes to switched-in demo tenants (full editing allowed, as requested).
- No RLS rewrites — `demo_rep` has no company link so existing tenant-scoped RLS naturally returns nothing for them outside a switch.
- No UI for managing rep accounts beyond the one-shot provision button.

## Files touched
- New: `supabase/migrations/<ts>_add_demo_rep_role.sql`
- New: `supabase/functions/seed-sales-rep-accounts/index.ts`
- Edit: `src/hooks/useSuperSwitcher.ts` (add `SALES_REP_EMAILS`, broaden stash check)
- Edit: `src/pages/SuperSwitcher.tsx` (gate by role, hide admin controls)
- Edit: `src/contexts/AuthContext.tsx` or `src/App.tsx` (demo_rep redirect guard + post-login route)
- Memory: append rep account list to `mem://platform-operations/demo-account-registry`
