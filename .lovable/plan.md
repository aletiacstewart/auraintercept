## Update saas_platform dispatch sidebar label to "Operations Map"

### Problem
For Aura Intercept (`saas_platform`), the bottom map-icon sidebar entry currently hardcodes to **"Video Console"** (via a route swap in `DashboardLayout.tsx`). The user confirmed it should instead read **"Operations Map"** since Aura is a SaaS platform, not a field-dispatch business.

### Changes
1. **`src/lib/industryNavLabels.ts`**
   - Add `saas_platform` to `INDUSTRY_OVERRIDES` with `dispatchView: 'Operations Map'`.
   - This ensures `getNavLabels()` returns the correct label for all consumers (sidebar, install pages, page headers).

2. **`src/components/dashboard/DashboardLayout.tsx`**
   - Update the `saas_platform` special-case block for `/dashboard/dispatch-field-ops` so the label reads **"Operations Map"** instead of "Video Console".
   - Keep the existing `/dashboard/video-console` route for now — no new page exists for an "Operations Map" view.

### Out of scope
- Building a new geographic / operations-map page.
- Changing the route target away from Video Console.

### Verification
- Log in as Aura Intercept tenant.
- Confirm the bottom Field Ops sidebar entry shows **"Operations Map"** instead of "Video Console".
- Confirm other industries still show their correct dispatch labels (e.g., "Dispatch View", "Route View", "Bay Queue").