---
name: Industry Capability Gating Standard
description: Centralized capability flags drive which dashboard KPIs, console tabs, and admin specialists each vertical sees
type: feature
---
**All cross-industry UI gating goes through `src/lib/industryCapabilities.ts`.** Do not hardcode `industry_id === 'restaurants'` checks in components — extend the capability functions instead.

**Available flags** (each takes the resolved `IndustryPack`):
- `hasFieldTechnicians(pack)` — false for booking cluster, restaurants, real_estate, beauty_wellness, salon, fitness, professional, personal_assistant.
- `usesQuotes(pack)` — false for restaurants, real_estate, beauty_wellness, salon, fitness, home_health, personal_assistant.
- `usesLeads(pack)` — false for restaurants, beauty_wellness, salon.
- `usesInventory(pack)` — false for restaurants, real_estate, beauty_wellness, salon, fitness, professional, personal_assistant.
- `usesCompaniesB2B(pack)` — true for trades/outdoor/repair clusters + professional + home_health.
- `usesAppointments(pack)` — false for restaurants (Smart Link only).

**Applied at:**
- `src/components/billing/BusinessOpsAgentConsole.tsx` — filters BASE_QUICK_ACTIONS and TABS (Quote/Invoice/Lead/Appts/Inventory/Companies).
- `src/components/dashboard/CompanyAdminDashboard.tsx` — filters KPI stat cards and quick-action grid by `industryHiddenHrefs` set.
- `src/pages/ai-consoles/BusinessManagementConsole.tsx` — `SpecialistOperativesLauncher.show` is now `pack.extra_operatives` (was hardcoded `['insurance_claim','permit_code']`).

**Platform admin override**: all gates respect `userRole === 'platform_admin'` and show the full surface for QA.

**Already industry-gated (do not re-gate):**
- `IndustryWidgetGrid` (uses `pack.dashboard_widgets`).
- `SpecialistOperativesConsole` (uses `pack.extra_operatives`).
- `SpecialistOperativesLauncher` (intersects requested set with `pack.extra_operatives`).
- `PortalQuickActions` (uses `BY_INDUSTRY` map + cluster fallback).
- `MarketingSalesConsole` / `CustomerPortalConsole` specialist lists.
- `getBusinessWorkflows` (per-industry override map + cluster fallback).
