---
name: Unified analytics home
description: /dashboard/analytics is the single analytics page; 7 old analytics routes redirect into its tabs
type: feature
---
Phase 2 (Sep 2026). `src/pages/Analytics.tsx` at `/dashboard/analytics` is the ONE analytics surface.

Company tabs: `overview`, `revenue`, `customers` (InsightsAnalytics), `forecast`, `performance` (PerformanceAnalytics), `reports` (AnalyticsAgentConsole + BusinessTypeContextStrip, wrapped in `FeatureGate requiredConsole="analytics_reports"`), `intake`. Platform admins without `?company=` still get Platform + Signup Funnel tabs.

Tab is driven by `?tab=`; unknown/legacy values resolve through `TAB_ALIASES` (e.g. `analytics`→overview, `insights`→customers, `kpi`/`export`→reports). Panels use the shared `src/components/analytics/AnalyticsTab.tsx` wrapper.

DELETED (routes now `<Navigate>` redirects into the tabs above; do not re-create):
`/dashboard/ai-consoles/analytics`, `business-insights`, `revenue-analysis`, `revenue-forecast`, `customer-insights`, `kpi-dashboard`, `performance-report`.

Report builders under `src/components/analytics/forms/` are kept — the reports console renders them inline.
