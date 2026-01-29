
Goal: Make the Lovable right-side preview automatically pick up new deployments without requiring you to send a chat message.

What I found (why this is still happening)
- The current “freshness” strategy is focused on data freshness (React Query invalidations) and iframe refresh inside the WidgetPreview, but it does not reliably detect “a new frontend bundle has been deployed”.
- In the Lovable preview, your app runs inside an iframe. In that context:
  - `refetchOnWindowFocus` may not fire reliably (iframe focus behavior differs from top-level tab focus).
  - `visibilitychange` may not fire in a way that correlates with “a new build is available”.
- Result: the preview can keep running an older JS bundle in memory until something causes a full navigation/reload. Sending a chat message often triggers a parent-level refresh/reload, which is why that appears to “fix it”.

Solution approach (add a deployment detector + auto-reload)
Implement an additional layer: periodically fetch the latest `index.html` with `cache: "no-store"`, detect whether the referenced hashed asset(s) changed, and reload the page if they did.
- This targets the real problem: the running app bundle is outdated compared to what the server would serve now.
- It works even if React Query refetches correctly, because it forces the app to load the new compiled JS/CSS.

Planned changes

1) Add a new hook: `useDeploymentAutoReload`
File: `src/hooks/useDeploymentAutoReload.ts` (new)
Responsibilities:
- Poll at a conservative interval (e.g., every 20–30 seconds) when running in Lovable preview.
- Fetch `GET /` (or same-origin base) with `cache: "no-store"` and “no-cache” headers.
- Parse the returned HTML for the current “build signature”, for example:
  - the `<script type="module" src="...">` path (Vite build filenames include a content hash)
  - optionally also `<link rel="stylesheet" href="...">`
- Compare that signature to:
  - the currently loaded module script src in the DOM (`document.querySelector('script[type="module"][src]')`)
  - and/or a stored value in memory/localStorage to avoid repeated reloads
- If the signature differs, trigger a single `window.location.reload()`.

Safety guards to prevent reload loops
- Only reload if we detect a stable change (e.g., two consecutive polls report a different signature), or store “last reloaded signature” and don’t reload again for the same signature.
- Pause polling while the tab/iframe is not visible (when possible) to reduce noise.
- Catch fetch errors (offline, transient) and do nothing rather than throwing.
- Use a backoff if multiple failures occur.

2) Wire the hook into the app
File: `src/App.tsx` (edit)
- Call `useDeploymentAutoReload()` inside `AppContent` (important: inside `QueryClientProvider` is fine; it doesn’t depend on it, but keeping “refresh hooks” together is cleaner).
- Ensure it runs in iframe context too (unlike `PWAUpdatePrompt`, we want this in preview).

3) Optional: strengthen “focus/visibility” refresh beyond React Query
File: `src/hooks/useVisibilityRefresh.ts` (edit, optional but recommended)
- In addition to `visibilitychange`, also listen for:
  - `window.addEventListener('focus', ...)`
  - `window.addEventListener('pageshow', ...)` (handles bfcache restores)
- This won’t solve “new bundle deployed” by itself, but it improves consistency for “data refresh when coming back”.

How we’ll verify (in Lovable preview)
- Step A: Load the preview on `/`.
- Step B: Make a small code change and let Lovable deploy it.
- Step C: Without sending a chat message, wait up to the polling interval.
Expected:
- The preview reloads itself once, then you see the updated UI.
- No repeated reload loop.

Edge cases and tradeoffs
- This adds a small periodic request to `/` in preview. We’ll keep interval conservative and stop/reduce when hidden.
- If the platform returns cached HTML despite `no-store`, we can adjust to fetch with a cache-busting query param (e.g., `/?_ts=...`) and/or use `HEAD` requests if supported.
- If your app route isn’t `/`, fetching `/` is still correct for a SPA because `/` serves the same `index.html` with current asset hashes.

Files impacted
- New: `src/hooks/useDeploymentAutoReload.ts`
- Edited: `src/App.tsx`
- Optional edit: `src/hooks/useVisibilityRefresh.ts`

Acceptance criteria
- After a deploy, the Lovable preview updates to the newest version automatically (within ~30s) without needing to initiate chat.
- No infinite reload loops.
- No new console errors.

If you approve this plan, I’ll implement the hook + App wiring first (minimal change set), then only tweak `useVisibilityRefresh` if needed based on observed behavior.
