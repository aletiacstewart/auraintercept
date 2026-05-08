# Add Industry Switcher access to Platform Admin Dashboard

## Problem

You logged in as `superadmin@auraintercept.ai` but landed on the regular Platform Admin dashboard instead of `/super-switcher`. Two things to fix:

1. The auto-redirect only fires from one login form (`handleLogin` in `Auth.tsx`). If the session was already active, or you came in through a different path, the redirect is skipped — leaving you on `/dashboard` with no visible way to reach the switcher hub.
2. There is no persistent UI affordance on the dashboard to open the switcher hub.

You asked for **a button on the existing dashboard**, so the fix is presentation-only.

## What to build

### 1. "Industry & Role Switcher" hero card on the Platform Admin dashboard
- Visible only when the signed-in user is `superadmin@auraintercept.ai` (or any `platform_admin` — TBD, default to the superadmin email to keep the regular admin dashboard clean).
- Placed at the top of the Platform Admin dashboard, above the existing "Welcome to the Aura Intercept admin panel" panel.
- Cyber-Sentry styled card with:
  - Title: "Demo Switcher Hub"
  - Subtitle: "Jump into any industry as Company / Employee / Customer without logging out."
  - Primary button: **"Open Switcher Hub"** → navigates to `/super-switcher`
  - Secondary inline text showing the last-used industry (read from `aura_super_switcher_industry` localStorage key, if present) with a "Resume" shortcut.

### 2. Persistent header chip
- Add a small "Switcher" chip next to the "CURRENT PLAN" badge in the top-right of the dashboard header, also gated to the superadmin email.
- One click → `/super-switcher`.
- Ensures the entry point is reachable from every screen in the admin shell, not just the dashboard body.

### 3. Auth redirect hardening (small)
- In `Auth.tsx`, the existing email check stays. Add one extra guard: when an already-authenticated `superadmin@auraintercept.ai` session lands on `/dashboard`, the new dashboard card is the safety net (no forced redirect — you stay where you are but the switcher is one click away).

## Out of scope

- No backend / RLS changes.
- No changes to `useSuperSwitcher` hook or `SwitcherPill` (already mounted globally for active switcher sessions).
- No edits to the demo seeder.

## Files to touch

- `src/pages/Dashboard.tsx` (or whichever component renders the "PLATFORM DASHBOARD" panel — confirm during implementation; likely `src/components/dashboard/PlatformAdminDashboard.tsx`).
- Header component used by the platform admin shell (for the chip).
- No new routes, no new edge functions.

## Acceptance

- Sign in as `superadmin@auraintercept.ai` → land on `/dashboard` → immediately see a "Demo Switcher Hub" card at the top with an **Open Switcher Hub** button.
- Click it → arrive at `/super-switcher` with the existing 18-industry grid.
- Header chip is visible from the dashboard for one-click access.
- Regular `platform_admin` and `company_admin` users see no change.
