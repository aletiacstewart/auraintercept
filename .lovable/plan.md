# Fix: Onboarding Invites page not reachable

## Problems
1. `/dashboard/onboarding-invites` route exists but has **no sidebar entry**, so there's no way to navigate to it.
2. The route is wrapped in `ProtectedRoute requiredRole="platform_admin"`. If your current session doesn't resolve to `platform_admin` immediately (race during role fetch, or you're logged in as a different role), it silently redirects to `/dashboard` — looking exactly like "the page doesn't exist."
3. Even once on the page, there's no way to **test the intake flow yourself** without sending a real email.

## Changes

### 1. Add sidebar entry (platform_admin only)
Add a nav item **"Onboarding Invites"** under the Platform Admin group in the main sidebar, visible only when `role === 'platform_admin'`. Icon: `Mail` or `Send`.

### 2. Harden the page route
- Keep `platform_admin` gating, but render a clear **"Access denied — platform admin only"** message instead of silent redirect, so the issue is visible when it occurs.

### 3. Add "Copy Link" + "Open Test Link" on the invites page
On the `OnboardingInvites` admin page:
- Ensure the table renders the full intake URL with a **Copy** button per row.
- Add a **"Generate Test Invite"** button at the top that creates an invite addressed to `ai@auraintercept.ai` and immediately opens `/intake/{token}` in a new tab — so you can preview the form end-to-end without waiting on email.

### 4. Verify existing invites
Check `onboarding_invites` table to confirm prior invites were actually created and the tokens are valid (so we know whether the email step or the listing UI is the failure point).

## Files touched
- `src/components/layout/AppSidebar.tsx` (or equivalent nav file) — add link
- `src/pages/admin/OnboardingInvites.tsx` — add Test Invite button, ensure Copy Link column
- `src/components/auth/ProtectedRoute.tsx` — show denied message instead of redirect for role mismatches (small, scoped change)

No database or edge-function changes required.
