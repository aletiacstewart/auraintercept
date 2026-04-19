

## Fix: Vite `@/*` alias resolution failure (site-wide)

### Diagnosis

The Vite error overlay points at `@/components/ui/sonner`, but the dev-server log shows **every `@/*` import failing simultaneously** (`@/integrations/supabase/client`, `@/components/dashboard/DashboardLayout`, `@/contexts/AuthContext`, `@/components/ui/button`, etc. — 40+ files).

Verified on disk:
- `src/components/ui/sonner.tsx` exists (877 bytes)
- `vite.config.ts` defines `resolve.alias["@"] = path.resolve(__dirname, "./src")` correctly
- `tsconfig.json` defines `paths: { "@/*": ["./src/*"] }` correctly
- `next-themes` and `sonner` are installed in `node_modules`

Conclusion: the source code is fine. Vite's pre-bundle / resolver state is stale. This is a runtime cache issue, not a code issue.

### Fix steps (default mode)

1. **Stop the dev server**, clear stale caches:
   - `rm -rf /dev-server/node_modules/.vite`
   - `rm -rf /dev-server/.vite`
2. **Touch `vite.config.ts`** (no content change) to force config re-read on restart.
3. **Restart the dev server** and confirm the log shows no further `Failed to resolve import "@/..."` errors.
4. **Verify in browser**: load `/` and confirm the overlay is gone.

### Fallback (if step 1–3 doesn't resolve it)

5. Re-save `vite.config.ts` with an identical alias block (sometimes a no-op rewrite is enough to bust HMR's resolver cache).
6. If still broken, reinstall deps: `rm -rf /dev-server/node_modules/.vite && npm install` (last resort — slow).

### Why not a code edit?

No source files need changes. `sonner.tsx`, `next-themes`, all alias targets, and both config files are correct. Editing code would not fix a resolver-cache issue.

Approve and I'll switch to default mode and run the cache clear + restart.

