

# Platform Simplification Audit — Recommendations for End Users

## What I reviewed
- 82 routed pages, 14 console pages, 12 sidebar nav groups, 8 home-page agent categories, 4 subscription tiers × 24 agents × 7 consoles, plus dual "Console + Mobile App" entries for nearly every workspace.
- Target users: HVAC, plumbing, pest, lawn, roofing, salon — typical owner has 1–10 employees, low patience for software.

## Core finding
The **engine is well-built and real**, but the **surface area shown to a typical company admin is overwhelming**. A company on Aura Boost sees ~9 sidebar groups and ~15 separate "console" / "install" links for what is really 4 jobs: *answer customers, dispatch jobs, send invoices, post content*.

## Top 10 simplification recommendations

### 1. Collapse "Console + Install" pairs into one page (HIGH impact)
Today every console has a separate **Install Mobile App** sidebar entry (Field Ops Install, Dispatch Install, Customer Portal Install, Business Mgt Install, Customer Website App). That's 5 redundant routes.
**Fix:** put a small "Install on phone" button inside each console header. Removes 5 nav items.

### 2. Merge the 4 marketing-ish nav groups into one "Marketing" group
Today: *Marketing Console*, *Social Media Console*, *Web Presence Console*, plus Outreach inside Marketing. Four groups, four single items each.
**Fix:** one **"Marketing"** group with 3 items (Outreach, Social, Website). Removes 3 collapsed group headers.

### 3. Merge Tech-Field + Dispatch-Field into "Field Ops"
Two separate groups with near-identical purpose. A small HVAC shop doesn't have a separate dispatcher — same person does both.
**Fix:** one **"Field Ops"** group with role-based default tab (Tech view vs Dispatcher view). Removes 1 group.

### 4. Hide the "AI Operatives Hub" by default for company admins
24 toggles is a power-user surface. Most owners will never touch it after onboarding.
**Fix:** move under Settings → Advanced. Keep visible to platform_admin only.

### 5. Drop or hide rarely-used standalone pages
These exist as routes but add noise: `BusinessOperations.tsx`, `OpportunityAudit.tsx`, `Calculators.tsx`, `Architecture.tsx`, `CyberSentryMockup.tsx`, `CyberSentryPortalMockup.tsx`, `DesignPreview.tsx`, `ExportDocumentation.tsx`.
**Fix:** keep mockup/design/architecture/export pages **platform_admin only** (already true for some — enforce for all). Hide Calculators behind a "Tools" submenu.

### 6. Consolidate Settings + Quick Setup + Knowledge Base
Three separate destinations for "configure your business." A new owner doesn't know which to open.
**Fix:** one **Settings** page with tabs: Business / Hours / Services / Integrations / Knowledge / Team / Notifications. Quick Setup becomes a one-time wizard, not a persistent nav item.

### 7. Replace the 8-card homepage agent grid with **3 outcome cards**
The landing page lists 8 categories × ~4 agents = 32 capabilities. SMB owners care about *outcomes*, not agents.
**Fix:** lead with 3 promises — **"Never miss a call"**, **"Fill your calendar"**, **"Get paid faster"** — then let curious visitors expand to see the agents underneath.

### 8. Default new companies to a **simplified dashboard view**
Add a "Simple / Pro" toggle in the dashboard header. Simple = today's top 5 KPIs + Aura command bar. Pro = current dense layout.

### 9. Rename agent-speak to plain English everywhere user-facing
"AI Receptionist", "Booking Agent", "Follow-Up Agent" are 3 separate things in our UI. To the owner it's just "the phone person."
**Fix:** in customer-facing copy, group them as **"Front Desk"** (1 thing). Keep the underlying agent split for the engine. Same for Route/ETA/Check-In → "On the way."

### 10. Trim the third-party integrations menu
7 items today (Voice Agent, Voice & SMS, Email, Calendar, Social, AI Research, 3rd Party Overview). Voice Agent and Voice & SMS overlap; AI Research is invisible to users.
**Fix:** 4 cards on one page — Phone & SMS, Email, Calendar, Social. Hide AI Research (platform_admin internal).

## Estimated impact
| Metric | Before | After |
|---|---|---|
| Sidebar groups (company admin, Pro tier) | 9 | 5 |
| Sidebar items (company admin) | ~22 | ~12 |
| Routes a new owner must understand week 1 | ~15 | 5 |
| Homepage cognitive load | 32 agents | 3 outcomes |

## Out of scope
- No engine/agent logic changes
- No tier/pricing changes
- No DB migrations
- No removal of features — just **hiding, grouping, renaming**

## Files that would change
- `src/components/dashboard/DashboardLayout.tsx` — nav restructure (#1, #2, #3, #4, #6, #10)
- `src/pages/Index.tsx` — homepage outcome cards (#7)
- `src/pages/Settings.tsx` — consolidate tabs (#6)
- `src/pages/Dashboard.tsx` + `CompanyAdminDashboard.tsx` — Simple/Pro toggle (#8)
- Console headers — add inline "Install on phone" button (#1)
- Public copy in landing components — plain-English rename (#9)
- Route guards on rarely-used pages — platform_admin only (#5)

## Recommended rollout order
1. Nav consolidation (#1, #2, #3, #10) — biggest visible win, lowest risk
2. Homepage outcome cards (#7)
3. Settings consolidation (#6)
4. Simple/Pro dashboard toggle (#8)
5. Plain-English rename pass (#9)
6. Hide power-user pages (#4, #5)

Want me to implement all 10, or pick a subset to start with?

