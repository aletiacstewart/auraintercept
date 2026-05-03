# Rename the homepage AI agents grid box

The grid box shown in the screenshot lives in `src/pages/Index.tsx` (lines 38–61) inside the static `agentCategories` array that powers the "Meet the AI Agents" homepage section. It still says **"Field & Dispatch Ops"** with trades-only agent names, which contradicts the new Service Delivery framing for all 28 verticals.

## Changes

**`src/pages/Index.tsx`** — update the `field` category object only:

- **Category name**: `Field & Dispatch Ops` → `Service Delivery`
- **Agent renames + neutral descriptions** (keep icons + RGB):
  - `Dispatch Agent` → `Assignment Agent` — "Smart job, visit, or appointment assignment by skills, availability, and workload"
  - `Route Agent` → `Routing Agent` — "Traffic-aware multi-stop routing for technicians, providers, and field teams"
  - `ETA Agent` — keep name — "Real-time arrival estimates and customer notification updates"
  - `Check-In Agent` — keep name — "Staff check-in, progress logging, and on-site or on-visit status updates"

## Out of scope

- Internal IDs (`id: 'field'`), routes (`/field-operations`), edge function keys, and the `dispatch` / `field_navigation` operative IDs stay unchanged — only marketing copy on the homepage tile changes.
- No other category boxes in this grid are touched.
