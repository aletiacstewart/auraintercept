## Goal
Stop the random refreshes and forced logouts users hit on dashboards/consoles, and confirm Stripe checkout works end‑to‑end for every plan plus the one‑time onboarding fee.

## Suspected causes (from code audit)

After reading `AuthContext`, `useDeploymentAutoReload`, `PWAUpdatePrompt`, `App.tsx`, `ErrorBoundary`, `vite.config.ts`, and the existing edge functions, the most likely culprits behind the “page reloads / kicks me to login” reports are:

1. **VitePWA `registerType: 'autoUpdate'` + `skipWaiting` + `clientsClaim`** in `vite.config.ts`. In production this can silently activate a new SW mid‑session and trigger a reload — exactly the “random refresh” symptom. Scope is `/technician` but the SW intercepts the whole origin while active.
2. **`App.tsx` SW self‑heal** unregisters every service worker on non‑`/technician` routes on every full app mount. Combined with VitePWA auto‑updating in another tab, this causes SW flapping: install → unregister → reinstall → reload.
3. **`useDeploymentAutoReload`** polls `/` every 60s in production and reloads when the asset hashes change. On Lovable preview/published, brief CDN inconsistency or a deploy mid‑session is enough to force a hard reload of an authenticated dashboard.
4. **`PWAUpdatePrompt`** triggers `window.location.reload()` 250 ms after `SKIP_WAITING`. Safe in theory, but combined with #1 it can fire without the “Update Now” banner ever being clicked because `autoUpdate` skips waiting itself.
5. **`AuthContext` check‑subscription interval** re‑creates `setInterval` every time `userRole` (and therefore `checkSubscription` identity) changes, and the function silently swallows `401`/`Auth session missing` instead of forcing a re‑auth. That isn’t the reload cause, but it masks expired sessions until the next navigation, which is when the user “suddenly gets logged out.”
6. **Multi‑tab / iframe session races.** The floating chat widget and embed pages share the same Supabase storage key. If two tabs both try to rotate the refresh token, one loses and Supabase emits `SIGNED_OUT` → `ProtectedRoute` bounces to `/auth`.

## Fix plan

### A. Kill the involuntary reload paths
1. `vite.config.ts` — switch VitePWA to `registerType: 'prompt'`, set `skipWaiting: false`, `clientsClaim: false`, and tighten `scope`/`navigateFallback` strictly to `/technician*` so the SW never touches `/dashboard`, `/customer*`, `/auth*`, `/checkout`, or the marketing site.
2. `src/App.tsx` — remove the blanket SW unregister effect. Replace it with a one‑shot guard that only unregisters a SW whose `scope` is not `/technician/`. Don’t purge `caches` on every mount.
3. `src/components/pwa/PWAUpdatePrompt.tsx` — make the “Update Now” reload the **only** path that calls `location.reload()`. Add a guard so it never runs when the user is on `/dashboard`, `/customer*`, `/auth*`, `/checkout`, `/onboarding`, or when an HTTP form/modal is dirty.
4. `src/hooks/useDeploymentAutoReload.ts` — keep the production gate but (a) require 5 consecutive mismatches (not 3), (b) also defer if the current route starts with `/dashboard`, `/customer-portal`, `/technician`, `/onboarding`, `/checkout`, `/subscription`, or `/auth`, and (c) never auto‑reload when an authenticated session exists. For those routes show a small toast prompting a manual refresh instead.
5. `src/components/error/ErrorBoundary.tsx` — drop the implicit `location.reload()` from the cache‑clear path and require an explicit user click.

### B. Make the auth session sticky
6. `src/contexts/AuthContext.tsx`:
   - Treat `TOKEN_REFRESHED` as a no‑op (don’t re‑run `fetchUserData`).
   - On `SIGNED_OUT` only clear local state if the previous session was real (skip on transient `getSession()` races).
   - Move the periodic `checkSubscription` to a stable interval that doesn’t reset when `userRole` changes; debounce calls so two rapid auth events don’t fire parallel edge‑function requests.
   - When `check-subscription` returns 401, force a `supabase.auth.refreshSession()` once before clearing state.
7. Add a single‑flight lock around `supabase.auth.refreshSession()` and respect `BroadcastChannel('supabase.auth')` so multiple tabs share one rotation and don’t evict each other.
8. Confirm `src/integrations/supabase/client.ts` is configured with `persistSession: true`, `autoRefreshToken: true`, `detectSessionInUrl: true` (it’s auto‑generated — verify only, don’t edit). If something looks off, document it for the user.

### C. Quiet down render loops
9. Audit `useEffect` deps in heavy console pages (`MarketingSalesConsole`, `SocialMediaConsole`, `FieldOpsConsole`, `BusinessManagementConsole`, `AnalyticsConsole`, `CustomerPortalConsole`, `ProfileWidgetGrid`) for unstable object/array deps that cause infinite re‑mounts; wrap derived data in `useMemo` and selectors in `useCallback`. Add a runtime guard that logs (`console.warn` only in dev) when the same effect fires > 20×/sec.
10. Verify the new `BusinessTypeContextStrip` and `MarketingMatrixCards` don’t resubscribe to Supabase on every render.

### D. Stripe checkout verification (auraintercept@gmail.com)
11. Confirm `STRIPE_SECRET_KEY` is present in edge‑function secrets; if not, request the user to add it.
12. Use `stripe_api_read` to verify each price ID referenced in `supabase/functions/create-checkout/index.ts` is **active** in the connected Stripe account:
    - Subscriptions: `price_1ThWTeJ9fo9y8fGHfDU4ZNq8` (Core), `price_1ThWTfJ9fo9y8fGHsbLQp0Za` (Boost), `price_1ThWTgJ9fo9y8fGHgoZLc8qu` (Pro), `price_1ThWThJ9fo9y8fGHGSowuwkR` (Elite).
    - One‑time onboarding fees: `price_1ThwUIJ9fo9y8fGHjmUhJtDw` ($249), `price_1ThwUJJ9fo9y8fGHvVRIyQCb` ($497), `price_1ThwUKJ9fo9y8fGHc8oQuO7u` ($994), `price_1ThwULJ9fo9y8fGHYwbM6gWn` ($1,990).
13. For each tier, dry‑invoke `create-checkout` against the test/live key the project is using to confirm both line items (subscription + onboarding) attach correctly and that the session URL returns 200.
14. Verify `check-subscription` resolves the customer for `auraintercept@gmail.com` (logs already show it currently returns `{subscribed:false, tier:'command'}` because no Stripe customer exists yet — once a checkout completes this should flip to `subscribed:true`).
15. If any price is missing or archived, recreate it via `create_stripe_product_and_price` and patch the IDs in `create-checkout` (and any other functions that reference them).
16. Confirm Stripe Customer Portal is enabled (`customer-portal` function exists) so users can manage / downgrade after the 60‑day window.

### E. Verification pass
17. Drive the app via Playwright as a signed‑in company admin: load `/dashboard`, sit idle 5 minutes with periodic interaction, navigate between 6 consoles, confirm no reload and no redirect to `/auth`.
18. Run the same pass with a customer portal account.
19. Hit `/subscription`, click upgrade on each of the 4 tiers, confirm Stripe Checkout opens with the right subscription + onboarding line items and the success URL returns the user authenticated.
20. Open `platform_issues` table and capture any new frontend errors logged during the test run; fix anything that surfaces.

## Out of scope
- Re‑theming, sidebar/menu structure, content/PDF updates (already shipped in prior turns).
- Backend schema changes; only edge‑function price IDs may be patched if Stripe verification finds drift.

## Deliverable
A short written report at the end of the build pass listing: every file changed, the Stripe verification result for each of the 8 price IDs, and the Playwright session evidence (no reload, no logout) for an admin + a customer.
