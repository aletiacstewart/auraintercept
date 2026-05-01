---
name: Industry-Aware UI Surfaces
description: Quick actions, console workflows, and sidebar labels resolve from industry_template_pack via cluster + per-industry overrides
type: feature
---
Three surfaces are now data-driven from the company's `industry_template_pack`:

1. **AuraCommandCenter quick actions** — `src/lib/industryQuickActions.ts` exports `getIndustryQuickActions(pack)`. Cluster defaults: trades / outdoor / repair / booking. Per-industry overrides: `real_estate`, `salon`. Component reads via `useIndustryPack()` and renders labels/descriptions directly (no i18n keys for the cards).
2. **BusinessManagementConsole workflow chains** — `src/lib/industryWorkflows.ts` exports `getBusinessWorkflows(pack)`. Cluster-specific chain sets; `{{job}}/{{customer}}/{{appointment}}` placeholders substituted from `pack.terminology`.
3. **Sidebar field-ops labels** — `src/lib/industryNavLabels.ts` exports `getNavLabels(pack)` returning `{ techView, dispatchView }`. DashboardLayout remaps the labels for `/dashboard/ai-consoles/field-ops` and `/dashboard/dispatch-field-ops` only.

To add a new vertical-specific copy set, add an entry to the `INDUSTRY_*` override maps — no component edits required. The `aura.json` `suggestions.*` keys for individual cards have been removed; only `sectionTitle` and `sectionHint` remain translated.
