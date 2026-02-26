

## Full Analysis

### What's currently missing vs. the mockup

The Cyber-Sentry mockup (image 2) has a **3-column layout**:
```
┌──────────────────┬────────────────────────────┬──────────────────┐
│  LEFT PANEL      │  CENTER (Tabs + Chat)       │  RIGHT PANEL     │
│  ACTIVE AGENTS   │                             │  QUICK ACTIONS   │
│  4 agent cards   │  [Tab pills]                │  7 action btns   │
│  SESSIONS/RESP   │  [Chat area / Content]      │  [Talk to Aura]  │
│  SESSION METRICS │  [Floating input]           │                  │
└──────────────────┴────────────────────────────┴──────────────────┘
```

All current consoles use a **single-column layout**:
```
┌──────────────────────────────────────────────┐
│  GlassHeader (full width)                    │
│  MobileTabNav (full width)                   │
│  Content area (full width, single column)    │
└──────────────────────────────────────────────┘
```

### What needs to change per console

**AIAgentConsole (Customer Portal)** — already has the 3-col skeleton from previous work but the Contact/Hours/Services/Voice tabs still render white `bg-white` cards. These inner tab content areas need the same obsidian glassmorphism treatment.

**BusinessOpsAgentConsole** — currently single column with `h-[600px]`. Needs:
- LEFT panel: 4 Business Ops agent cards (Quoting, Invoicing, Lead Gen, Operations) with ACTIVE/STANDBY status
- RIGHT panel: Quick Actions as vertical sidebar (Quote, Invoice, Lead, Appts, Inventory, Companies, Employees, Customers)
- CENTER: existing tab nav + content (forms, chat)

**AnalyticsAgentConsole** — currently single column. Needs:
- LEFT panel: 3 Analytics agent cards (Performance Analyst, Revenue Analyst, Insight Engine) with status
- RIGHT panel: 8 Quick Action buttons (Report, Revenue, Insights, Forecast, KPIs, Social, Reminders, Export)
- CENTER: existing content

**MarketingSalesAgentConsole** — currently single column. Needs:
- LEFT panel: 3 Marketing agent cards (Campaign Manager, Lead Generator, Audience Analyst) with status
- RIGHT panel: 3 Quick Actions (Campaign, Leads, Marketing)
- CENTER: existing content

**SocialMediaAgentConsole** — currently single column. Needs:
- LEFT panel: 2-3 Social agent cards (Content Creator, Brand Voice, Social Scheduler) with status
- RIGHT panel: 2 Quick Actions (Create Content, My Posts) + extra social metrics
- CENTER: existing content with the content engine tabs

**FieldOpsAgentConsole** — currently single column. Needs:
- LEFT panel: 4 Field Ops agent cards (Dispatch, Route, ETA, Check-in) with live job counts
- RIGHT panel: 9 action buttons (Accept, Directions, En Route, ETA, Arrive, Complete, Quote, Invoice, Dispatch)
- CENTER: existing content (job selector, map, chat)

### Implementation Plan

**Strategy**: Create a reusable `CyberConsoleLayout` wrapper component that provides the 3-column shell. Each console passes its left-panel agent definitions and right-panel actions as props. The center slot receives children.

#### New file: `src/components/ai/chat/CyberConsoleLayout.tsx`
A reusable 3-column wrapper:
- Props: `agents[]` (name, icon, status, color, sessions, avgResp), `rightPanel` (ReactNode), `header` (ReactNode), `tabs` (ReactNode), `children` (center content)
- LEFT: obsidian panel `rgba(2,6,14,0.98)` with border-r `rgba(0,229,255,0.1)`, agent cards with ACTIVE/STANDBY pings, session metrics footer
- CENTER: flex-1 for tabs + content
- RIGHT: obsidian panel `rgba(2,6,14,0.98)` with border-l `rgba(0,229,255,0.1)`, Quick Actions sidebar

#### Files to update (5 consoles + AIAgentConsole inner tab styling):

**1. `BusinessOpsAgentConsole.tsx`**
- Wrap content in 3-col layout
- Define 4 agent definitions: `{ name: 'Quoting Agent', icon: FileText, color: '#00e5ff', status: 'active' ... }`
- Move QUICK_ACTIONS to right panel vertical sidebar
- Remove `pb-32` content scroll padding — input floats over center column only

**2. `AnalyticsAgentConsole.tsx`**
- Wrap content in 3-col layout
- Define 3 agent defs: Performance Analyst (cyan), Revenue Analyst (emerald), Insight Engine (purple)
- Move QUICK_ACTIONS to right panel

**3. `MarketingSalesAgentConsole.tsx`**
- Wrap in 3-col layout
- Define 3 agent defs: Campaign Manager (pink/feature-marketing), Lead Generator (yellow), Audience Analyst (indigo)
- Right panel: Campaign, Leads, Marketing actions + extra Marketing metrics

**4. `SocialMediaAgentConsole.tsx`**
- Wrap in 3-col layout
- Define agents: Content Creator, Brand Voice Manager, Post Scheduler
- Right panel: Create Content, My Posts actions

**5. `FieldOpsAgentConsole.tsx`**
- Wrap in 3-col layout
- LEFT panel uses FIELD_OPS_AGENT_CONFIG (dispatch, route, eta, checkin) which already exists
- RIGHT panel: the FIELD_OPS_AGENTS action buttons (already defined as `FIELD_OPS_AGENTS` array)

**6. `AIAgentConsole.tsx` — inner tab content fixes**
- Contact tab: change `border border-border bg-white` → `border border-cyan-400/15 bg-white/3` glassmorphism cards
- Hours tab: change `bg-white border-border` → `bg-white/3 border-cyan-400/12`
- Services tab: already uses `glass-panel` class, just ensure it resolves to obsidian

### Files to create/edit: 7 files

| File | Change |
|------|--------|
| `src/components/ai/chat/CyberConsoleLayout.tsx` | NEW — reusable 3-col shell with agent left panel |
| `src/components/billing/BusinessOpsAgentConsole.tsx` | Add 3-col layout, move actions to right panel |
| `src/components/analytics/AnalyticsAgentConsole.tsx` | Add 3-col layout, move actions to right panel |
| `src/components/marketing/MarketingSalesAgentConsole.tsx` | Add 3-col layout, move actions to right panel |
| `src/components/social/SocialMediaAgentConsole.tsx` | Add 3-col layout, move actions to right panel |
| `src/components/employee/FieldOpsAgentConsole.tsx` | Add 3-col layout, move actions to right panel |
| `src/components/ai/AIAgentConsole.tsx` | Fix Contact/Hours/Services inner tab bg colors |

### CyberConsoleLayout structure

```tsx
// Left Panel Agent Card example (per console):
{
  name: 'Quoting Agent',
  icon: FileText,
  description: 'Generates and manages quotes',
  status: 'active' | 'standby',
  color: '#00e5ff',
  sessions: 87,
  avgResp: '0.9s',
}

// Renders:
// ┌─ ACTIVE AGENTS ─────────────────┐
// │ [icon] Quoting Agent ● ACTIVE   │
// │        Sessions: 87 | Resp: 0.9s│
// ├─────────────────────────────────┤
// │ SESSION METRICS                 │
// │ SESSION STATUS   LIVE           │
// │ AVG RESPONSE     <1s            │
// │ SATISFACTION     98.4%          │
// └─────────────────────────────────┘
```

### Right Panel Quick Action (vertical buttons)

```tsx
// Each action button in right panel:
<button style={{ background: `hsl(${hsl}/0.06)`, border: `1px solid hsl(${hsl}/0.2)` }}>
  <div style="glow badge icon container"> <Icon /> </div>
  <span>Action Label</span>
</button>
```

### What does NOT change
- All data logic, hooks, form components, Supabase calls — untouched
- Mobile behavior: left/right panels remain `hidden lg:flex` (same as current AIAgentConsole pattern)
- MobileTabNav stays on all consoles for mobile
- The GlassHeader is already shared and already has neon styling
- No routes, no DB changes

