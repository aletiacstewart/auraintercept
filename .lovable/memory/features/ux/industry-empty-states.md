---
name: Industry-Aware Empty States
description: Per-vertical empty-state copy + CTAs resolved from industry pack across leads/quotes/invoices/customers/inventory/jobs surfaces
type: feature
---
# Industry-Aware Empty States

When a console list/grid is empty, surfaces render `<IndustryEmptyState surface="..." />` instead of generic "No X yet" copy.

## Resolution
`getIndustryEmptyState(surface, pack)` in `src/lib/industryEmptyStates.ts`:
1. industry_id override (e.g. `real_estate.jobs` → "Add a listing")
2. cluster override (e.g. `trades.jobs` → "Add a service area")
3. generic fallback (preserves prior wording)

## Surfaces
`jobs | leads | quotes | customers | inventory | appointments | employees | invoices`

## Component
`src/components/shared/IndustryEmptyState.tsx` — Cyber-Sentry styled card; CTA either navigates to `ctaRoute` or copies `ctaPrompt` to clipboard. Accepts `onAction` override for in-page modals (e.g. open Add dialog).

## Wired surfaces
- `src/pages/Leads.tsx`, `Quotes.tsx`, `Invoices.tsx`, `Customers.tsx`
- `src/components/leads/LeadsManager.tsx`, `quotes/QuotesManager.tsx`, `invoices/InvoicesManager.tsx`
- `src/components/businessops/InventoryMatrix.tsx` (only when not filtering low-stock)
- `src/components/employee/CompletedJobsHistory.tsx`

## Out of scope
Search-result empties, form validation empties, marketing-site empties.
