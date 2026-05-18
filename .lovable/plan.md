## Why it's missing

The "Super Admin Hub" return button is rendered in two places:

1. **Floating pill** (`SwitcherPill`) — mounted globally in `App.tsx`, shows top-left/right for any `@demo.com` session.
2. **Inline header button** (`SuperHubInlineButton`) — placed directly in each dashboard's top bar so it can't be missed.

The company admin dashboard has the inline button in its desktop header. The technician and customer demos are missing it on the surfaces you're hitting:

- `TechnicianDashboardLayout.tsx` — the inline button is only inside the **mobile header** (line 134). The **desktop layout has no header at all**, just a sidebar, so on 1286px viewport you see nothing. That's exactly what your screenshot shows.
- `CustomerPortalHome.tsx` — has the inline button, but `CustomerCompanyPortal.tsx` and `CustomerDashboard.tsx` (the other two customer entry pages) do not.

The floating `SwitcherPill` should still auto-activate for `@demo.com` users, but it's small and easy to miss / can collide with browser chrome — the inline button is the dependable path.

## Fix

Single surface: add an always-visible inline "Super Admin Hub" button in the headers of every demo-facing dashboard.

1. **`TechnicianDashboardLayout.tsx` (desktop branch)** — there is currently no top bar. Add a slim sticky header strip above `<main>` (only when `user.email` ends with `@demo.com`) that renders `<SuperHubInlineButton />` flush right. No change to the mobile branch (already has it).
2. **`CustomerCompanyPortal.tsx`** — drop `<SuperHubInlineButton />` into the existing top header row.
3. **`CustomerDashboard.tsx`** — same treatment in its top header row.
4. **`SwitcherPill`** — leave as-is. Auto-activation already covers `@demo.com`.

The button itself self-hides when the user isn't a `@demo.com` account, so the strip becomes a no-op for real customers/technicians.

## Verification

1. Log into `appliancerepairemployee@demo.com` → `/technician` on desktop shows "Super Admin Hub" button in a thin top bar, clicks return to `/super-switcher`.
2. Same email on mobile width → existing mobile header button still works (no regression).
3. Log into any `…customer@demo.com` → both `/customer` (CustomerCompanyPortal) and `/customer/dashboard` (CustomerDashboard) show the button.
4. Log into a non-demo customer/tech → no button (self-hides).

## Out of scope

- No changes to `SwitcherPill` floating logic.
- No changes to the super-switcher auth flow.
- No styling changes to existing headers beyond adding the button slot.
