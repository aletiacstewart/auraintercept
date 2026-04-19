

## Diagnosis (root cause finally identified)

The dev server has been running on the **same pid (238) since 02:57:39** — it never restarted across any of the previous fix attempts. That's why clearing `node_modules/.vite`, editing `vite.config.ts`, and changing the alias format all had zero effect: Vite holds its resolver/module graph in memory, and a config change requires a full process restart to take effect.

The code is fine:
- ✅ `src/components/ui/sonner.tsx` exists (877 bytes, modified 02:57)
- ✅ `vite.config.ts` has correct `@` → `./src` alias
- ✅ `node_modules/sonner` and `node_modules/next-themes` are installed
- ✅ `tsconfig.json` paths are correct

The 40+ simultaneous `@/*` failures across unrelated files confirm this is a single resolver-process issue, not 40 separate code bugs.

## Fix (default mode — single step)

**Force a hard kill + restart of the Vite dev process.**

1. `pkill -9 -f vite` to terminate the stuck process (pid 238 and any children).
2. Clear `/dev-server/node_modules/.vite` one more time for safety.
3. The Lovable sandbox supervisor will auto-respawn the dev server with a fresh process, fresh config, and fresh resolver.
4. Confirm via `tail /tmp/dev-server-logs/dev-server.log` that a NEW pid line appears and `VITE ready in Xms` prints again.
5. Verify `@/*` errors are gone in the log.

No source files need editing. This is purely a process-restart fix.

### Fallback if pkill doesn't trigger respawn

Touch `vite.config.ts` (append a trailing newline) after the kill — Lovable's supervisor watches config files and will respawn on change.

