
## The Real Problem

The consolidation was **half-done**. The agent IDs used for chat routing (`initialAgent`) were updated to the new names, but the **visual agent panels** (the sidebar cards inside each console) still show old/wrong separate agents that don't match the 10-operative model. Additionally, some `currentAgentId` mappings still reference completely old deprecated IDs.

Here is what each console actually shows right now vs what it should show:

### Console-by-Console Audit

**Marketing & Sales Console (`MarketingSalesAgentConsole.tsx`)**
- Currently shows 3 agents: `outreach`, `leads_manager`, `audience`
- `leads_manager` and `audience` are NOT in the 10-operative model
- Should show: 1 agent — **Outreach Agent** (`outreach`)

**Analytics Console (`AnalyticsAgentConsole.tsx`)**
- Currently shows 3 agents: `analytics_intelligence`, `analytics_revenue`, `analytics_insights`
- `analytics_revenue` and `analytics_insights` are NOT in the 10-operative model
- Should show: 1 agent — **Analytics Intelligence** (`analytics_intelligence`)

**Business Ops Console (`BusinessOpsAgentConsole.tsx`)**
- Currently shows 5 agents: `business_finance`, `admin`, `companies`, `employees`, `customers`
- `companies`, `employees`, `customers` are data managers, NOT AI operatives
- `currentAgentId` mapping still references old IDs: `quoting`, `invoicing`, `leads`, `inventory`, `operations` (none of which exist in the panel anymore — causes broken highlighting)
- Should show: 2 agents — **Business Finance** + **Admin**. Fix the broken `currentAgentId` mapping.

**Field Ops Console (`FieldOpsAgentConsole.tsx`)**
- Currently shows 2 agents: `dispatch`, `field_navigation` — **this is already correct**
- No changes needed here

**Social Media Console (`SocialMediaAgentConsole.tsx`)**
- Currently shows 3 agents: `creative_content`, `brand_voice`, `content_engine`
- `brand_voice` and `content_engine` are NOT in the 10-operative model
- Should show: 1 agent — **Creative Content** (`creative_content`)
- Fix `currentAgentId` and `onAgentClick` mappings

**Customer Portal Console (`BookingAgentConsole.tsx`)**
- Uses a completely different old-style UI (no `CyberConsoleLayout`)
- Already uses `customer_journey` as the `initialAgent` — the chat routing is correct
- No sidebar agent panel to update

### What Changes

**File 1: `src/components/marketing/MarketingSalesAgentConsole.tsx`**
- Replace `MARKETING_AGENTS` (3 entries) with single `outreach` agent
- Simplify `currentAgentId` prop — always `outreach`
- Simplify `onAgentClick` to open campaign action
- Remove `UserPlus`, `Users` icon imports that become unused

**File 2: `src/components/analytics/AnalyticsAgentConsole.tsx`**
- Replace `ANALYTICS_AGENTS` (3 entries) with single `analytics_intelligence` agent
- Fix `currentAgentId` — always `analytics_intelligence`
- Fix `onAgentClick` — single agent routes to the `performance` action
- Remove `DollarSign`, `TrendingUp` icon imports that become unused

**File 3: `src/components/billing/BusinessOpsAgentConsole.tsx`**
- Remove `companies`, `employees`, `customers` from `BOPS_AGENTS` — keep only `business_finance` and `admin`
- Fix broken `currentAgentId` mapping: replace old IDs (`quoting`, `invoicing`, `leads`, `inventory`, `operations`) with correct new IDs (`business_finance`, `admin`)
- Fix `onAgentClick` mapping to use new IDs
- Remove `Building2`, `UserCheck`, `UsersRound` icon imports

**File 4: `src/components/social/SocialMediaAgentConsole.tsx`**
- Replace `SOCIAL_AGENTS` (3 entries) with single `creative_content` agent
- Fix `currentAgentId` — always `creative_content`
- Fix `onAgentClick` — routes to `create-content` action
- Remove `Wand2`, `Inbox` icon imports that become unused

### Result After Fix
Each console's sidebar will match the 10-operative model:
- Customer Portal: `triage` + `customer_journey` (Booking console)
- Field Ops: `dispatch` + `field_navigation` (already correct)
- Business Ops: `business_finance` + `admin`
- Outreach & Sales: `outreach`
- Creative & Social: `creative_content`
- Analytics: `analytics_intelligence`
