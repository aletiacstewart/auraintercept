# Phase 2 — One Analytics Home

## What I found first

The unified analytics dashboard you're asking for already exists at `/dashboard/analytics`. It has live tabs: Overview, Revenue, AI Agents, Forecast, Insights, Intake (plus a platform-wide view with the Signup Funnel for platform admins), all reading real company data.

The seven pages you listed are thin wrappers around things that already live elsewhere:

- **Analytics & Reports console** — the ask-a-question reports console. It already contains every report builder inline (performance, revenue, customers, insights, forecast, KPI, export, reminders, social).
- **Business Insights / Revenue Analysis / Revenue Forecast / Customer Insights / KPI Dashboard / Performance Report** — six single-purpose pages, each showing one report builder that the console above already offers.

So Phase 2 is a consolidation, not a rebuild. Rebuilding a new page from scratch would throw away working data wiring and leave the current analytics page orphaned.

## The plan

**One analytics home at `/dashboard/analytics`** with these tabs:

1. **Overview** — headline numbers and trend charts (existing)
2. **Revenue** — revenue mix, trend, and averages (existing)
3. **Customers** — customer insight reporting (existing Insights tab, renamed and focused)
4. **Forecast** — revenue and demand forecast (existing)
5. **Performance** — team and AI agent performance (existing AI Agents tab, renamed)
6. **Reports** — the full ask-a-question reports console with every report builder and CSV/report export (moved in from the Analytics & Reports console page)
7. **Intake** — form intake breakdown (existing, kept)

Platform admins keep their Platform and Signup Funnel tabs.

**Deleting** the seven pages listed, and pointing their old web addresses at the new home so any saved link, bookmark, or in-app button still lands somewhere useful.

**Menu change** — "Analytics & Reports" in the Business group now opens `/dashboard/analytics` directly, keeping the bar-chart icon. Shortcut buttons on dashboards, industry quick actions, voice commands ("show me analytics"), and the help assistant all get repointed to the same address.

**Access** — the same plan requirement that guards the reports console today moves with it, so nothing becomes free that wasn't before.

## Technical details

- Fold `AnalyticsAgentConsole` (with its `FeatureGate requiredConsole="analytics_reports"`, `HowToUseModal`, `MedicalComplianceNotice`, `BusinessTypeContextStrip`) into a `reports` tab inside `src/pages/Analytics.tsx`; rename tab values `performance` → Performance, `insights` → Customers, add `reports`. Keep `?tab=` deep-linking working, and map legacy tab names so `auraQueryParser` links keep resolving.
- Delete: `src/pages/ai-consoles/AnalyticsConsole.tsx`, `BusinessInsightsPage.tsx`, `RevenueAnalysisPage.tsx`, `DemandForecastPage.tsx`, `CustomerInsightsPage.tsx`, `KpiDashboardPage.tsx`, `PerformanceReportPage.tsx`; drop their exports from `src/pages/ai-consoles/index.ts`. The form components under `src/components/analytics/forms/` stay — the console renders them.
- `src/App.tsx`: remove the seven lazy imports and routes; add `<Navigate to="/dashboard/analytics?tab=..." replace />` for each old path (revenue-analysis → `tab=revenue`, revenue-forecast → `tab=forecast`, customer-insights/business-insights → `tab=customers`, kpi-dashboard/performance-report → `tab=reports`, analytics → default).
- Add a shared `src/components/analytics/AnalyticsTab.tsx` wrapper (loading skeleton, error state, optional CSV export slot) and use it for the tab panels.
- Repoint references: `DashboardLayout.tsx` nav item + `data-tour-id` branch, `profileConsoleMap.ts` C6 key, `voiceNavigation.ts` analytics aliases, `industryQuickActions.ts` (9 revenue-analysis entries), `BusinessMgtOpsInstall.tsx`, `helpSystemPrompt.ts`, `PlatformGuides.tsx` route map.
- Charts stay on Recharts with theme tokens; period-over-period +/- indicators added to the Overview KPI cards.
- Verify: typecheck/build, sidebar has no dead link, each old address redirects, and the Reports tab still generates a report.
