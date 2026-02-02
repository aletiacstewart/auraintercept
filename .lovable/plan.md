
# Update Operative Dependencies & Subscription Plans

## Summary
This plan addresses inconsistencies in operative dependencies across three key files and ensures subscription plan agent listings match the 24-agent total.

---

## 1. OperativeDependencyGraph.tsx Updates

### Issues Found:
- `AGENT_DISPLAY_NAMES` missing: `admin`, `creative`, `web_presence`, `marketing`
- Still references `promo` instead of `marketing`
- `DEPENDENCY_MAP` missing entries for new agents
- No category config for consolidated social_media with web_presence

### Changes:

**A. Update AGENT_DISPLAY_NAMES (lines 38-61):**
```typescript
const AGENT_DISPLAY_NAMES: Record<string, string> = {
  triage: 'AI Receptionist',
  booking: 'Scheduling',
  followup: 'Follow-up',
  review: 'Review',
  dispatch: 'Dispatch',
  route: 'Route',
  eta: 'ETA',
  checkin: 'Check-in',
  admin: 'Admin',
  quoting: 'Quoting',
  invoice: 'Invoice',
  inventory: 'Inventory',
  campaign: 'Campaign',
  lead: 'Lead',
  marketing: 'Marketing',  // Changed from promo
  social_content: 'Content',
  social_scheduler: 'Scheduler',
  social_analytics: 'Analytics',
  creative: 'Creative',
  web_presence: 'Web Presence',
  insights: 'Insights',
  performance: 'Performance',
  revenue: 'Revenue',
  forecast: 'Forecast',
};
```

**B. Update DEPENDENCY_MAP (lines 64-87) to match subscriptionAgentConfig.ts:**
```typescript
const DEPENDENCY_MAP: Record<string, string[]> = {
  // Customer Portal
  triage: [],
  booking: ['triage'],
  followup: ['triage'],
  review: ['triage'],
  // Field Operations
  dispatch: ['triage', 'booking'],
  route: ['dispatch'],
  eta: ['dispatch', 'route'],
  checkin: ['dispatch'],
  // Business Operations
  admin: [],
  quoting: ['triage'],
  invoice: ['quoting'],
  inventory: [],
  // Marketing & Sales
  campaign: [],
  lead: [],
  marketing: ['campaign'],
  // Social Media & Web Presence
  social_content: [],
  social_scheduler: ['social_content'],
  social_analytics: ['social_content'],
  creative: [],
  web_presence: ['creative'],
  // Analytics
  insights: [],
  performance: ['insights'],
  revenue: ['insights'],
  forecast: ['insights', 'revenue'],
};
```

---

## 2. subscriptionAgentConfig.ts AGENT_DEPENDENCIES Sync

### Current Issues:
- `lead` has `['triage']` but documentationConfig shows no dependencies
- Missing `admin` agent dependency entry
- `marketing` should depend on `campaign` (marketing extends campaign functionality)

### Changes to AGENT_DEPENDENCIES (lines 105-122):
```typescript
export const AGENT_DEPENDENCIES: Record<string, string[]> = {
  // Customer Portal
  booking: ['triage'],
  followup: ['triage'],
  review: ['triage'],
  // Field Operations
  dispatch: ['triage', 'booking'],
  route: ['dispatch'],
  eta: ['dispatch', 'route'],
  checkin: ['dispatch'],
  // Business Operations
  invoice: ['quoting'],
  // Marketing & Sales
  marketing: ['campaign'],
  // Social Media & Web Presence
  social_scheduler: ['social_content'],
  social_analytics: ['social_content'],
  web_presence: ['creative'],
  // Analytics
  performance: ['insights'],
  revenue: ['insights'],
  forecast: ['insights', 'revenue'],
};
```

---

## 3. PricingComparisonTable.tsx Updates

### Issues:
- Missing Creative Agent and Web Presence Agent from AI Agents list
- Comment says "22 total" but we have 24 agents
- Agent count header shows wrong numbers

### Changes:

**A. Update section title comment (line 116):**
```typescript
// Command tier adds (14 more = 24 total)
```

**B. Add missing agents to AI Agents section (after line 128):**
```typescript
{ name: 'Creative Agent', express: 'x', halo: 'x', core: 'x', singlePoint: 'x', multiTrack: 'x', command: 'check' },
{ name: 'Web Presence Agent', express: 'x', halo: 'x', core: 'x', singlePoint: 'x', multiTrack: 'x', command: 'check' },
```

**C. Add feature descriptions (lines 31-37):**
```typescript
'Creative Agent': 'Unified AI content generation for all channels. Creates on-brand content for web presence, social media, campaigns, blogs, and lead nurturing.',
'Web Presence Agent': 'AI-powered website and blog management. Auto-optimizes SEO, suggests content updates, monitors site performance, and auto-publishes blog posts.',
```

---

## 4. Subscription.tsx "See More Details" Updates

### Issues:
- AI Agents section missing Creative Agent and Web Presence Agent
- Section title shows "(0 / 3 / 10 / 24)" which is incomplete (missing express/halo/flow counts)

### Changes:

**A. Update sections array - AI Agents title (line 226):**
```typescript
title: 'AI Agents (0 / 3-4 / 3 / 10 / 24)',
```

**B. Add missing agents to features array (after line 246):**
```typescript
{ name: 'Creative Agent', core: 'x', singlePoint: 'x', multiTrack: 'x', command: 'check' },
{ name: 'Web Presence Agent', core: 'x', singlePoint: 'x', multiTrack: 'x', command: 'check' },
```

**C. Add feature descriptions (lines 46-47):**
```typescript
'Creative Agent': 'Unified AI content generation for all channels. Creates on-brand content for web presence, social media, campaigns, and blogs.',
'Web Presence Agent': 'AI-powered website and blog management. Auto-optimizes SEO, monitors site performance, and auto-publishes blog posts from the Content Engine.',
```

---

## 5. Update Primary Customer Flow in OperativeDependencyGraph

### Current (line 230):
Shows linear flow: triage → booking → dispatch → route → eta → checkin → followup → review

### Updated Flow:
Keep current flow but ensure it aligns with dependency structure

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/ai/agents/OperativeDependencyGraph.tsx` | Add missing agents, fix dependencies, remove `promo` reference |
| `src/lib/subscriptionAgentConfig.ts` | Sync AGENT_DEPENDENCIES with documentationConfig |
| `src/components/landing/PricingComparisonTable.tsx` | Add Creative & Web Presence agents, fix count |
| `src/pages/Subscription.tsx` | Add missing agents to "See More Details" table |

---

## Dependency Visualization (Final State)

```text
Customer Portal:
  triage (root) ─┬─► booking ─► dispatch ─┬─► route ─► eta
                 ├─► followup             └─► checkin
                 └─► review

Business Operations:
  admin (root)
  quoting ─► invoice
  inventory (root)

Marketing & Sales:
  campaign (root) ─► marketing
  lead (root)

Social Media & Web Presence:
  social_content (root) ─┬─► social_scheduler
                         └─► social_analytics
  creative (root) ─► web_presence

Analytics:
  insights (root) ─┬─► performance
                   └─► revenue ─► forecast
```

---

## Validation Checklist
- [ ] All 24 agents have entries in AGENT_DISPLAY_NAMES
- [ ] DEPENDENCY_MAP matches AGENT_DEPENDENCIES in subscriptionAgentConfig.ts
- [ ] PricingComparisonTable lists all 24 agents
- [ ] Subscription.tsx "See More Details" lists all 24 agents
- [ ] No references to `promo` agent remain (all changed to `marketing`)
