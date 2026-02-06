
# UI Update Plan: 7-Tier Subscription Restructure

## Problem Summary

The backend configuration files were updated with the new tier structure, but the landing page UI components still display the **old tier names, agent counts, and console assignments**.

---

## Files Requiring Updates

### 1. `src/pages/Index.tsx` (Pricing Cards)
**Current State → Required State:**

| Current Name | New Name | Price | Agents | Consoles |
|--------------|----------|-------|--------|----------|
| Aura Express | **Aura Starter** | $197/mo | 1 | 0 |
| Aura Flow | **Aura Scheduling** | $297/mo | 3 | 1 |
| Aura Halo | **Aura Growth** | $397/mo | 11 | 3 |
| Aura Core | **Aura Business** | $500/mo | 12 | 4 |
| Aura Single-Point | **Aura Field Ops** | $1,500/mo | 18 | 6 |
| Aura Multi-Track | **Aura Performance** | $3,997/mo | 24 | 7 |
| Aura Pro Command | **Aura Command** | $5,997/mo | 24 | 7 |

**Changes:**
- Update all 7 pricing card names
- Update agent/console counts in card descriptions
- Update employee limits (2/3/5/8/15/25/50)
- Update hero section copy to match ChatGPT's proposed marketing copy
- Reorganize cards from "Industry-Specific" + "General Business" sections into a "Growth Ladder" visual

### 2. `src/components/landing/PricingComparisonTable.tsx`
**Current State:**
- Table headers: Express, Flow, Halo, Core, Single-Point, Multi-Track, Command
- AI Agents row: (1 / 7 / 12 / 8 / 12 / 18 / 24)
- Control Centers row: (0 / 1 / 4 / 2 / 4 / 5 / 7)

**Required State:**
- Table headers: Starter, Scheduling, Growth, Business, Field Ops, Performance, Command
- AI Agents row: (1 / 3 / 11 / 12 / 18 / 24 / 24)
- Control Centers row: (0 / 1 / 3 / 4 / 6 / 7 / 7)

**Detailed Changes:**
1. Update `FeatureRow` interface property names: `express` → `starter`, `flow` → `scheduling`, etc.
2. Update section titles
3. Update all feature rows with correct checkmarks per tier
4. Update employee counts: (2/3/5/8/15/25/50)

---

## Agent Distribution (Corrected)

### Aura Starter ($197) - 1 agent
```
triage
```

### Aura Scheduling ($297) - 3 agents
```
triage, booking, followup
```

### Aura Growth ($397) - 11 agents
```
triage, booking, followup, review,
campaign, lead, marketing,
social_content, social_scheduler, social_analytics,
creative
```

### Aura Business ($500) - 12 agents
```
All from Growth + web_presence
```

### Aura Field Ops ($1,500) - 18 agents
```
All from Business +
dispatch, route, eta, checkin, quoting, invoice
```

### Aura Performance ($3,997) - 24 agents
```
All from Field Ops +
admin, inventory, insights, performance, revenue, forecast
```

### Aura Command ($5,997) - 24 agents
```
All agents (same as Performance) +
Priority Support, Dedicated Account Manager
```

---

## Console Distribution (Corrected)

| Console | Starter | Scheduling | Growth | Business | Field Ops | Performance | Command |
|---------|---------|------------|--------|----------|-----------|-------------|---------|
| Customer Portal | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Outreach & Sales | — | — | ✓ | ✓ | ✓ | ✓ | ✓ |
| Social Media | — | — | ✓ | ✓ | ✓ | ✓ | ✓ |
| Creative & Web | — | — | — | ✓ | ✓ | ✓ | ✓ |
| Field Operations | — | — | — | — | ✓ | ✓ | ✓ |
| Business Management | — | — | — | — | ✓ | ✓ | ✓ |
| Analytics & Reports | — | — | — | — | — | ✓ | ✓ |
| **Total** | **0** | **1** | **3** | **4** | **6** | **7** | **7** |

---

## Implementation Steps

### Phase 1: Update PricingComparisonTable.tsx
1. Rename `FeatureRow` interface properties:
   - `express` → `starter`
   - `flow` → `scheduling`
   - `halo` → `growth`
   - `core` → `business`
   - `singlePoint` → `fieldOps`
   - `multiTrack` → `performance`
   - `command` → `command` (unchanged)

2. Update table header row (lines 305-338):
   - "Aura Express" → "Aura Starter"
   - "Aura Flow" → "Aura Scheduling"
   - "Aura Halo" → "Aura Growth"
   - "Core" → "Aura Business"
   - "Single-Point" → "Aura Field Ops"
   - "Multi-Track" → "Aura Performance"
   - "Command" → "Aura Command"

3. Update sections array (lines 87-194):
   - Change `title: 'AI Agents (1 / 7 / 12 / 8 / 12 / 18 / 24)'` to `'AI Agents (1 / 3 / 11 / 12 / 18 / 24 / 24)'`
   - Change `title: 'Control Centers (0 / 1 / 4 / 2 / 4 / 5 / 7)'` to `'Control Centers (0 / 1 / 3 / 4 / 6 / 7 / 7)'`
   - Update every feature row with correct tier assignments

4. Update employee counts:
   - From: `'2 included', '1 included', '3 included', '2 included', '5 included', '10 included', '25 included'`
   - To: `'2 included', '3 included', '5 included', '8 included', '15 included', '25 included', '50 included'`

### Phase 2: Update Index.tsx Pricing Cards
1. Rename all pricing card titles (7 cards total)
2. Update feature lists on each card
3. Update agent/console counts
4. Update employee limits
5. Update section headers from "Industry-Specific" + "General Business" to a unified "Growth Ladder"

### Phase 3: Update Hero Copy (Optional)
Match ChatGPT's proposed copy:
- Headline: "AI Agents that grow with your business"
- Sub-headline: "Start by answering calls. End with a fully automated company."

---

## Summary

| File | Lines Changed (Approx) |
|------|------------------------|
| `PricingComparisonTable.tsx` | ~250 lines |
| `Index.tsx` | ~400 lines |
| **Total** | ~650 lines |

This update will align the UI with the backend configuration changes already made to `subscriptionAgentConfig.ts`, `ai-agent-chat/index.ts`, and other configuration files.
