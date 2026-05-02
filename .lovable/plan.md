# Phase 6 — Task 5: Industry-Aware Empty States

Replace generic "No X yet" placeholders across the platform with **industry-specific, actionable** empty states that match the active industry pack (trades, salon, real-estate, restaurant, etc.).

## Goals
- Every console with a list/grid shows a vertical-specific first action when empty.
- Click of the empty-state CTA either navigates to the relevant create flow OR fires an Aura prompt (consistent with existing `PortalQuickActions` pattern).
- Zero new dependencies; reuse `useIndustryPack` + a new `industryEmptyStates.ts` registry.

## What to build

### 1. New registry — `src/lib/industryEmptyStates.ts`
A typed map keyed by **surface** (jobs, leads, quotes, customers, inventory, appointments, employees, invoices, technicians) returning per-cluster + per-industry copy + CTA:
```ts
interface EmptyState {
  icon: LucideIcon;
  title: string;          // "No showings booked"
  body: string;           // "Add your first listing to start scheduling tours."
  ctaLabel: string;       // "Add a listing"
  ctaRoute?: string;      // navigate target
  ctaPrompt?: string;     // OR Aura prompt (clipboard fallback)
}
getEmptyState(surface, pack): EmptyState
```
Resolution order: industry_id → cluster → generic fallback (preserving today's wording so nothing regresses).

Examples:
- **jobs** + trades → "Add your first service area"
- **jobs** + salon → "Add your first stylist + chair"
- **jobs** + real_estate → "Add your first listing"
- **jobs** + restaurant → "Add a reservation slot"
- **inventory** + trades → "Stock your first truck"
- **inventory** + restaurant → "Add a menu item"
- **employees** + salon → "Invite your first stylist"
- **employees** + real_estate → "Invite your first agent"

### 2. New component — `src/components/shared/IndustryEmptyState.tsx`
Cyber-Sentry styled card (theme tokens only). Props: `surface`, optional `pack` override, optional `onAction` override. Resolves pack via `useIndustryPack()`, renders icon + title + body + primary action button. Default action: navigate to `ctaRoute`, or copy `ctaPrompt` to clipboard + toast (mirrors `PortalQuickActions`).

### 3. Wire into top-traffic surfaces (replace existing empty blocks)
Touch only the visible empty-state JSX — no logic changes:
- `src/pages/Leads.tsx` → `surface="leads"`
- `src/pages/Quotes.tsx` → `surface="quotes"`
- `src/pages/Invoices.tsx` → `surface="invoices"`
- `src/pages/Customers.tsx` → `surface="customers"`
- `src/pages/Inventory.tsx` → `surface="inventory"`
- `src/pages/Employees.tsx` → `surface="employees"`
- `src/pages/EmployeeAppointments.tsx` → `surface="appointments"`
- `src/components/employee/CompletedJobsHistory.tsx` → `surface="jobs"`
- `src/components/quotes/QuotesManager.tsx` → `surface="quotes"`
- `src/components/leads/LeadsManager.tsx` → `surface="leads"`
- `src/components/invoices/InvoicesManager.tsx` → `surface="invoices"`
- `src/components/businessops/InventoryMatrix.tsx` → `surface="inventory"`
- `src/pages/technician/TechnicianJobs.tsx` → `surface="jobs"` (uses `pack.terminology.job` in title)

Other empty states (settings forms, search-no-results) stay unchanged — those aren't workflow-actionable.

### 4. Memory update
Add `mem://features/ux/industry-empty-states` to index referencing the new registry + component, plus the surface list above.

## Acceptance
- Switching `industry_id` in `companies` row visibly changes empty-state copy + CTA in Leads / Quotes / Inventory / Employees / Jobs without code changes.
- Generic fallback identical to current text for any unmapped surface/industry combo.
- No theme regressions (CSS vars only), no new console warnings.

## Out of scope
- Search-result-empty states ("No matches for…")
- Form validation empties
- Marketing-site empties

After your approval I'll implement in this order: registry → component → wire 13 surfaces → memory update.