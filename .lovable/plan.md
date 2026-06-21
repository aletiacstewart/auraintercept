## Problem

`useDeploymentAutoReload` and the module-level Vite HMR handler in `src/hooks/useDeploymentAutoReload.ts` are firing full-page `window.location.reload()` calls while you click through the sidebar, consoles, and demo pages. Two specific triggers cause the "random refreshes":

1. **Vite HMR reconnect handler** — every time the dev server pushes an HMR update (which happens constantly while we make edits, and also on transient websocket drops), the module-level `vite:ws:connect` listener calls `window.location.reload()` after a 500 ms delay. `shouldDeferReload()` only blocks it if the mouse moved in the last 30 s, the tab is a demo session, a Radix modal is open, or SuperSwitcher is switching — plain navigation does NOT count as "active", so a fresh page mount after a click is wide open to being reloaded.
2. **Deployment poller** — fetches `/?_ts=…` every 20 s and reloads when the bundle hash changes. In dev, Vite rewrites script hashes on every restart, so the poller keeps thinking there is a "new deployment" and reloads.

`useVisibilityRefresh` is fine (it only invalidates queries after 5 min hidden).

## Fix

Edit `src/hooks/useDeploymentAutoReload.ts` only — no other files.

1. **Disable the entire hook in dev / preview.** Wrap both the `useEffect` body and the module-level `import.meta.hot` block in `if (import.meta.env.PROD) { … }`. Lovable's preview iframe already reloads on real publishes via its own infra, and the dev sandbox handles HMR through Vite — we don't need a second reload loop on top of it. This eliminates the random refreshes during navigation in the preview.

2. **Tighten the production path** so the same thing can't happen on the published site mid-click:
   - Treat the most recent route change as activity. Add a `lastRouteChangeAt` timestamp that updates on `popstate` and on `history.pushState` / `replaceState` (monkey-patch once at module load), and include `Date.now() - lastRouteChangeAt < 15_000` in `shouldDeferReload()`.
   - Require **3** consecutive signature mismatches (up from 2) and bump `pollIntervalMs` default from 20 s to 60 s so transient CDN swaps don't trigger.
   - In the `vite:ws:connect` handler (still PROD-gated out, but for completeness) keep the existing defer checks.

3. **Leave `useVisibilityRefresh` and every other file untouched.**

## Verification

- Navigate sidebar → consoles → demo pages in the preview: no `[DeploymentAutoReload]` reload logs, no white-flash refresh.
- `grep` confirms no other call sites of `useDeploymentAutoReload` need changes.
- Build passes.

## Open question

Do you want the deployment auto-reload to keep running on the **published** site (`auraintercept.ai`), just with the stricter rules above? Or fully off everywhere and rely on users refreshing manually after a deploy? Default in this plan: keep it on in production with the stricter rules, off in dev/preview.
