# Fix `/appointments` 404

## What's happening
The screenshot shows the preview address bar pointed at `/appointments`, which returns the SPA 404 page. The router only defines `/dashboard/appointments` (in `src/App.tsx`); no top-level `/appointments` route exists, and no in-app link points at the bare path — it's reachable only by typing the URL directly.

## Fix
Add a redirect alias in `src/App.tsx` so the bare path lands on the real page:

```tsx
<Route path="/appointments" element={<Navigate to="/dashboard/appointments" replace />} />
```

`Navigate` is already imported in `App.tsx`. No other files change.

## Out of scope
Not touching any unrelated routes, sidebar entries, or appointment logic.
