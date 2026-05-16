## Goal
Make `superadmin@auraintercept.ai` always land on the Super Switcher hub (`/super-switcher`) instead of the platform admin dashboard, regardless of how they arrive (login, direct nav to `/dashboard`, or refresh).

## Current behavior
- `Auth.tsx` login already redirects this email to `/super-switcher` ✅
- But visiting `/` → "Go to dashboard", `/dashboard`, or refreshing on `/dashboard` renders `PlatformAdminDashboard` because `Dashboard.tsx` only branches on `userRole`, not on this specific super-admin identity.

## Change
In `src/pages/Dashboard.tsx`, add a redirect effect: if the signed-in user's email equals `SUPER_ADMIN_EMAIL` (`superadmin@auraintercept.ai`), `navigate('/super-switcher', { replace: true })` and render nothing.

```ts
import { SUPER_ADMIN_EMAIL } from '@/hooks/useSuperSwitcher';
...
useEffect(() => {
  if (!loading && user?.email?.toLowerCase() === SUPER_ADMIN_EMAIL) {
    navigate('/super-switcher', { replace: true });
  }
}, [loading, user, navigate]);
```

Place it next to the existing technician-redirect effect, and short-circuit `renderDashboard` for that email so the platform dashboard never flashes.

## Out of scope
- Other platform_admins (e.g. `ai@auraintercept.ai`) keep their normal dashboard.
- No changes to `Auth.tsx` (already correct) or to route guards.