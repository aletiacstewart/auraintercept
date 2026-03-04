

## The Problem

The Active Agents left panel is purely decorative. Agent cards are not clickable, cannot be interacted with, and only highlight passively based on what tab the user already clicked via the top icon row. The request is to make the agent cards themselves **fully interactive**:

1. **Clicking an agent card** → activates that agent, highlights it as ACTIVE, changes STANDBY→ACTIVE badge, and navigates to/triggers the relevant console section
2. **Clicking a top icon tab** → the correct agent card in the left panel highlights and becomes ACTIVE
3. The status badge must flip from `STANDBY` → `ACTIVE` dynamically (not just styling — the displayed text changes too)

### Root Cause

In `CyberConsoleLayout.tsx`, the agent cards have no `onClick` handler. They are purely read-only display. The `isActive` flag drives styling but has no way to be changed from within the left panel itself — it only reads from the parent's `currentAgentId` prop.

There is also no `onAgentClick` callback defined in the `CyberConsoleLayoutProps` interface.

---

## Solution Plan

### Step 1 — Add `onAgentClick` callback to `CyberConsoleLayout`

In `CyberConsoleLayout.tsx`:
- Add `onAgentClick?: (agentId: string) => void` to `CyberConsoleLayoutProps`
- Make each agent card `div` a clickable element with `cursor-pointer`, hover effect, and `onClick={() => onAgentClick?.(agent.id)}`
- The status badge text already shows `ACTIVE` when `isActive === true` — this works already

### Step 2 — Map agent IDs to tab IDs in each console

Each console needs an `agentId → tabId` mapping so clicking an agent card triggers the correct tab/form. Each console already has a `onTabChange` handler that drives the content — we just need to call it from the agent card click.

**FieldOps mappings:**
- `dispatch` → `chat` (home / dispatch chat)
- `route` → `directions`
- `eta` → `eta`
- `checkin` → `arrive_start`

**BusinessOps mappings:**
- `quoting` → `quote`
- `invoicing` → `invoice`
- `leads` → `lead`
- `operations` → `appointments` (general ops tab)

**MarketingSales mappings:**
- `marketing` → `campaign`
- `leads` → `leads`
- `audience` → `customers`

**Analytics mappings:**
- `analytics` → `performance`
- `revenue` → `revenue`
- `insights` → `customers`

**SocialMedia mappings:**
- `social_content` → `create-content`
- `brand_voice` → `create-content` (settings sub-tab)
- `scheduler` → `my-posts`

### Step 3 — Wire `onAgentClick` in each console

In each console's `<CyberConsoleLayout>` usage, add:
```tsx
onAgentClick={(agentId) => {
  const tabId = AGENT_TO_TAB_MAP[agentId];
  if (tabId) {
    // call the same tab change handler
    handleTabChange(tabId); // or setActiveTab + trigger action
  }
}}
```

This means clicking an agent card is functionally identical to clicking the matching icon tab — same handler, same result. The highlighting already follows because `currentAgentId` is derived from the active form/tab state.

### Files to change:
1. `src/components/ai/chat/CyberConsoleLayout.tsx` — add `onAgentClick` prop + make cards clickable with hover states
2. `src/components/employee/FieldOpsAgentConsole.tsx` — add `onAgentClick` mapping
3. `src/components/billing/BusinessOpsAgentConsole.tsx` — add `onAgentClick` mapping
4. `src/components/marketing/MarketingSalesAgentConsole.tsx` — add `onAgentClick` mapping
5. `src/components/analytics/AnalyticsAgentConsole.tsx` — add `onAgentClick` mapping
6. `src/components/social/SocialMediaAgentConsole.tsx` — add `onAgentClick` mapping

### Visual UX enhancement in `CyberConsoleLayout`:
- Add `cursor-pointer` to agent cards
- Add hover state: slightly brighter border glow on hover
- Add a subtle `scale(1.01)` transform on hover for tactile feedback
- The ACTIVE/STANDBY badge already flips based on `isActive` — no extra work needed there

