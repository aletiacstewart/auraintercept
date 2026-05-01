# Fix Industry Widget 404s (All Industries)

## Root Cause

`src/components/dashboard/IndustryWidgetGrid.tsx` defines CTA routes for every widget, but most of them point at unprefixed paths (`/field-ops`, `/leads`, `/customers`, `/quotes`, `/inventory`, `/analytics`, `/dashboard/call-history`, `/dashboard/settings`) that **do not exist** in `src/App.tsx`. The router only registers them under `/dashboard/...` (e.g. `/dashboard/leads`, `/dashboard/calls`, `/dashboard/dispatch-field-ops`). So clicking any of those widgets produces a 404 / NotFound render.

This is what's hitting Real Estate Demo Elite — its widgets (`showings_calendar`, `lead_scoring`, `listing_tracker`, `review_pulse`, `missed_calls`) route to `/leads`, `/customers`, `/dashboard/call-history`, etc. — none of which exist.

The bug affects **every industry pack**, not just Real Estate — Real Estate just happens to be the one being tested.

## Fix

Single-file change: rewrite the `cta.route` values in `WIDGET_REGISTRY` (`src/components/dashboard/IndustryWidgetGrid.tsx`) to the real registered routes.

### Route Mapping

| Old (404)                  | New (correct)                             |
|----------------------------|-------------------------------------------|
| `/field-ops`               | `/dashboard/dispatch-field-ops`           |
| `/inventory`               | `/dashboard/inventory`                    |
| `/quotes`                  | `/dashboard/quotes`                       |
| `/analytics`               | `/dashboard/analytics`                    |
| `/customers`               | `/dashboard/customers`                    |
| `/leads`                   | `/dashboard/leads`                        |
| `/dashboard/call-history`  | `/dashboard/calls`                        |
| `/dashboard/settings`      | `/dashboard/quick-setup`                  |
| `/dashboard/appointments`  | `/dashboard/appointments` (already valid) |
| `/dashboard/employees`     | `/dashboard/employees` (already valid)    |
| `/dashboard/integrations/calendar` | already valid                     |
| `/dashboard`               | already valid                             |

### Real Estate widgets (verified post-fix)
- `showings_calendar` → `/dashboard/appointments`
- `lead_scoring` → `/dashboard/leads`
- `listing_tracker` → `/dashboard/customers`
- `review_pulse` → `/dashboard` (Reviews live on the main dashboard)
- `missed_calls` → `/dashboard/calls`

### Sweep all clusters

I'll update every widget's `cta.route` in the registry to use a route that exists in `App.tsx`, so Trades, Outdoor, Repair, and Booking-First packs are all fixed in the same pass.

## Files Changed

- `src/components/dashboard/IndustryWidgetGrid.tsx` — replace CTA route strings only (no UI / logic changes).

## Verification

After the change I'll grep the file to confirm every `route:` value matches a `<Route path="...">` in `src/App.tsx`, so no industry pack widget can produce a 404.
