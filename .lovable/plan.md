# Rename Homepage Tile → "Service Delivery Console"

## Changes

### 1. `src/pages/Index.tsx` (~L170-178) — rename console tile
- **Name**: `Service Delivery Console`
- **Description**: `Schedule, assign, and track every job, visit, or appointment in real time — across technicians, providers, stylists, and agents.`
- **Features**:
  - `Smart scheduling & assignment`
  - `Route & visit optimization`
  - `Live status & ETA tracking`
  - `Staff check-in & updates`
- Keep icon (`Truck`) or swap to a more neutral one. Recommend **`CalendarClock`** or **`Route`** to feel less trades-only. (Default: `CalendarClock`.)

### 2. `src/pages/Index.tsx` L466 — rotating subtitle
`'Field Operations'` → `'Service Delivery'`

### 3. `src/pages/Index.tsx` L979 — mid-tier feature blurb
`'Field Operations + Social Media + Analytics'` → `'Service Delivery + Social Media + Analytics'`

### 4. `src/components/landing/PricingComparisonTable.tsx`
- L46 tooltip key + L136 row name: rename `'Field Operations Console'` → `'Service Delivery Console'`
- New tooltip: `Real-time console to schedule, assign, and track jobs, visits, and appointments across every staff role.`

## Out of Scope
- Internal route `/field-operations`, file `FieldOpsConsole.tsx`, pack flag `hasFieldTechnicians`, and the in-app sidebar label all stay (covered by canonical naming registry + industry-aware nav labels).
- This change is **homepage marketing copy only**.

## Files
- `src/pages/Index.tsx`
- `src/components/landing/PricingComparisonTable.tsx`

Reply **go** to apply.
