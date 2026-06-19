## Current state (audit)

Only **3 surfaces** consume the new 185-business-type marketing matrix (`marketingPlatformMatrix.ts`) generated from your uploaded `AuraIntercept_MarketingPlatformGuide.xlsx`:

| Surface | Uses new matrix? |
|---|---|
| Marketing & Sales console (C4) | Yes — channel mix + ad/content guidance |
| Social Media console (C5) | Yes — social-only channel chips + content pillars |
| Dashboard (`ProfileWidgetGrid`) | Yes — compact "Marketing focus" strip |
| **Field Ops console (C2)** | No — only `useIndustryPack` (cluster-level) |
| **Business Management console (C3)** | No — only `useIndustryPack` |
| **Customer Portal console (C6)** | No — only `useIndustryPack` |
| **Analytics console (C7)** | No — only profile/industry presets |
| **Specialist Operatives console** | No |
| **Sub-pages**: KPI Dashboard, Revenue, Performance, Demand Forecast, Customer Insights, Business Insights, New Lead | No |

The 4-tier pricing, profile gating (A–J), and agent visibility are already correctly wired to all 185 types via `getProfileForBusinessType()`. What's missing is **per-business-type content** on the non-marketing consoles.

So the honest answer: **no — only the two marketing consoles and the dashboard strip are wired to the new data.** The other consoles still read cluster/profile-level copy.

## Plan — extend per-business-type data to the remaining consoles

### 1. Field Ops console (C2) — `FieldOpsConsole.tsx`
- Add a "Field workflow tuned for your business type" panel using `useCompanyBusinessType` + `getProfileForBusinessType` to surface:
  - Crew/technician noun from `labelOverrides`
  - Job-flow hints from the matrix `keyNotes` field
  - Whether dispatch / route / ETA agents are enabled (already in profile spec)
- New shared component `BusinessTypeContextStrip` (read-only, theme tokens only).

### 2. Business Management console (C3) — `BusinessManagementConsole.tsx`
- Add the same `BusinessTypeContextStrip` plus a "Recommended operatives for your business type" list derived from `PROFILE_SPECS[profileKey].agentsAlwaysOn + agentsDefaultOn` so admins see exactly which AI operatives are recommended for their specific business type.

### 3. Customer Portal console (C6) — `CustomerPortalConsole.tsx`
- Surface industry-tuned portal copy already in `industryPortalCopy.ts` but currently only used in some places. Pull through the resolved business type so e.g. "Pet Groomer" sees pet-profile language, "DJ" sees event language, etc.

### 4. Analytics console (C7) + sub-pages
- `AnalyticsConsole.tsx`, `KpiDashboardPage.tsx`, `RevenueAnalysisPage.tsx`, `PerformanceReportPage.tsx`, `DemandForecastPage.tsx`, `CustomerInsightsPage.tsx`, `BusinessInsightsPage.tsx`:
  - Pass resolved business type to existing `industryAnalyticsPresets` lookup so KPI labels, revenue groupings, and forecast seasonality match the specific business type (not just the cluster).
  - Add a small "Benchmarks for {businessType}" header reading from `GROUP_PLATFORM_SUMMARY` (topPaid / topOrganic) so analytics shows which channel to credit conversions against.

### 5. Specialist Operatives console
- Show only the specialists relevant to the resolved business type using the matrix `category` field + `PROFILE_SPECS[key].agentsHidden`.

### 6. New helper — `src/lib/businessTypeConsoleContext.ts`
- Single function `getConsoleContext(businessType)` returning `{ profileKey, profileSpec, matrixRow, groupSummary, labelOverrides }` so every console resolves the same way (no duplicate lookups).

### 7. Tests
- Snapshot test asserting each of the 7 consoles renders a non-empty business-type context block for a sample type from each of the 18 categories.
- Test asserting every entry in `BUSINESS_TYPE_TO_PROFILE` resolves to a console context with a defined `profileSpec`.

## Out of scope
- No changes to pricing, agent definitions, profile A–J specs, sidebar gating, or the marketing/social consoles (already done).
- No DB migrations — all data is static.
- No homepage / signup picker changes.
