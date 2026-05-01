# Console & Dashboard Text Color Standardization

Apply the same rule we just applied to the landing page across every console and dashboard surface that renders on the dark theme:

1. **All grey text → pure white (`#FFFFFF` / `text-white`)** — body copy, descriptions, secondary labels, helper text, "muted" text on cards.
2. **Grid-box titles → match their color-coded icon** — wherever a card/tile has a colored icon (a `feature-*`, `channel-*`, neon, or tier color), the card's title takes the same color. Numeric values stay white. Descriptions stay white.
3. **Sidebar text stays white as-is** — no changes to `AppSidebar`, `SidebarMenuButton`, `Sidebar*` primitives or their nav items.

## Scope (files to update)

### Dashboards
- `src/components/dashboard/CompanyAdminDashboard.tsx` — KPI grid (12 stat cards), Quick Actions grid, Snapshot rows, Recent Activity card
- `src/components/dashboard/PlatformAdminDashboard.tsx` — admin metrics + grids
- `src/components/dashboard/EmployeeDashboard.tsx` — employee KPI tiles
- `src/components/dashboard/AuraCommandCenter.tsx` — hero metrics, quick chips
- `src/components/dashboard/AuraTodayStrip.tsx` — today's items
- `src/components/dashboard/LaunchProgressCard.tsx`, `TrialBanner.tsx`, `DashboardSetupNav.tsx`, `DashboardOnboardingHub.tsx`, `MobileInstallBanner.tsx`, `DashboardViewToggle.tsx`
- `src/pages/Dashboard.tsx`, `src/pages/technician/TechnicianDashboard.tsx`, `TechnicianCalendar.tsx`, `TechnicianHistory.tsx`, `TechnicianJobs.tsx`

### AI Consoles (`src/pages/ai-consoles/`)
All 12 console pages:
- `FieldOpsConsole.tsx`, `BusinessManagementConsole.tsx`, `MarketingSalesConsole.tsx`, `AnalyticsConsole.tsx`, `SocialMediaConsole.tsx`, `CustomerPortalConsole.tsx`
- Insight pages: `BusinessInsightsPage.tsx`, `CustomerInsightsPage.tsx`, `KpiDashboardPage.tsx`, `DemandForecastPage.tsx`, `NewLeadPage.tsx`, `PerformanceReportPage.tsx`, `RevenueAnalysisPage.tsx`

### Console Sub-Components (rendered inside the consoles)
- `src/components/ai/AIAgentConsole.tsx`, `AIAgentSettings.tsx`, `AppointmentTrackingView.tsx`
- `src/components/employee/FieldOpsAgentConsole.tsx`, `TechnicianJobQueue.tsx`, `CompletedJobsHistory.tsx`, `AppointmentCalendar.tsx`
- `src/components/businessops/CustomersManager.tsx` and other `businessops/*` panels rendered inside Business Management Console
- `src/components/analytics/*` charts/tiles used inside Analytics Console
- `src/components/social/*` panels inside Social Media Console
- `src/components/aura/AuraResponseRenderer.tsx`, `charts/AuraStatCard.tsx` (stat card titles → match icon color)

### Excluded
- `src/components/ui/sidebar.tsx`, `src/components/dashboard/AppSidebar*`, any `Sidebar*` nav rendering — leave text white.
- Marketing/landing pages (already done).
- Public auth pages, customer portal public pages (different surfaces — out of scope unless on dark bg; we'll only touch ones inside the authenticated console shell).

## Technical approach

**Step 1 — Grey → White.** In each in-scope file, replace these classes wherever they appear on text inside a console/dashboard card:
- `text-muted-foreground` → `text-white`
- `text-white/40`, `text-white/50`, `text-white/60`, `text-white/70`, `text-white/80` → `text-white`
- `text-card-foreground/70`, `text-card-foreground/80`, `text-card-foreground/90` → `text-white`
- `text-slate-300/400/500`, `text-gray-300/400/500`, `text-zinc-300/400/500` → `text-white`
- Inline `color: rgba(...)` low-opacity light values → `color: '#FFFFFF'`

Exceptions kept as-is:
- Status colors (red/amber/green/emerald for errors, warnings, success badges).
- Tier accent colors (teal/sky/purple/amber on pricing).
- Brand colors on integration logos.
- Disabled states inside form inputs.
- Sidebar navigation text.

**Step 2 — Color-coded titles.** For every grid card/tile that has a colored icon, give the `CardTitle` (or equivalent `<h3>/<div>`) the same text color class as the icon. Examples:

`CompanyAdminDashboard.tsx` KPI grid (line 183–195):
```tsx
// before
<CardTitle className="text-xs font-medium text-card-foreground/90 ...">{stat.title}</CardTitle>
// after — derive from stat.colorClass (already 'bg-feature-X/15 text-feature-X')
<CardTitle className={cn("text-xs font-medium tracking-wide", stat.titleColorClass)}>
  {stat.title}
</CardTitle>
```
Where `titleColorClass` is the `text-feature-*` half of `colorClass` (e.g., `text-feature-employees`, `text-feature-customers`, `text-feature-leads`, `text-feature-appointments`, `text-feature-quotes`, `text-feature-invoices`, `text-secondary`, `text-channel-sms`, `text-feature-inventory`, `text-feature-marketing`, `text-primary`, `text-feature-analytics`).

Console page grids that use Lucide icons with explicit color classes (e.g., `text-purple-500`, `text-cyan-400`): the sibling `CardTitle` adopts the same class.

Stat cards inside Aura responses (`AuraStatCard`): title takes the icon's color (default `text-primary`).

Numbers/values remain white for legibility; only the **title label** changes color.

**Step 3 — QA pass.** After edits, scan each touched file with `rg "text-muted-foreground|text-white/[0-9]"` to confirm only intentional remnants (status badges, sidebar) remain.

## Out of scope / not changed
- Sidebar component & nav links.
- Form input placeholder colors (browser-controlled).
- Tooltip / popover interior text where contrast already passes on its own background.
- Landing page (already standardized in the previous loop).

## Risk
Low. Changes are class-name-only; no behavior, no data, no routes affected. Visual regression is the only risk and is the intended outcome.
