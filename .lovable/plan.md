## Problem

The preview won't load because the Vite dev server is stuck reporting "Failed to resolve import" errors for `@/...` paths (AuthContext, supabase/client, DashboardLayout, locales, etc.). All of those files exist on disk and the `@` alias in `vite.config.ts` is correct, so this is a wedged dev-server cache, not a code bug.

## Fix

1. Restart the Vite dev server (`code--restart_dev_server`).
2. Tail the dev-server log to confirm Vite comes back up clean (no remaining resolve errors).
3. Open the preview at `/auth` in the browser tool to confirm the login screen renders.

If after restart any resolve error remains, view that single file and repair the bad import — but based on current disk state none are expected.

## Out of scope

No code or content changes. No further launch-readiness work this turn — just unblock the preview so you can log in.