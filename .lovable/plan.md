
# Option C Implementation Plan: Pricing + Agent Redistribution

## Summary of Changes

This plan updates all 7 subscription tiers with:
1. New pricing across all tiers
2. Performance tier reduced from 24 to 22 agents (remove advanced analytics)
3. Command tier keeps all 24 agents (exclusive: revenue + forecast agents)
4. Priority Support and Dedicated Account Manager removed as tier-exclusive features

---

## Price Updates

| Tier | Current | New | Change |
|------|---------|-----|--------|
| Aura Starter | $197 | $197 | - |
| Aura Scheduling | $297 | **$397** | +$100 |
| Aura Growth | $397 | **$597** | +$200 |
| Aura Business | $500 | **$797** | +$297 |
| Aura Field Ops | $1,500 | **$1,497** | -$3 |
| Aura Performance | $3,997 | **$3,497** | -$500 |
| Aura Command | $5,997 | **$5,497** | -$500 |

---

## Agent Redistribution (Option C)

### Performance Tier - 22 Agents (was 24)

Remove `revenue` and `forecast` agents from Performance. Keep basic analytics with `insights` and `performance`.

```text
Performance ($3,497) - 22 Agents:
├── Customer Portal (4): triage, booking, followup, review
├── Field Operations (4): dispatch, route, eta, checkin
├── Business Operations (4): admin, quoting, invoice, inventory
├── Marketing & Sales (3): campaign, lead, marketing
├── Social Media (3): social_content, social_scheduler, social_analytics
├── Analytics (2): insights, performance  ← REDUCED
└── Creative & Web (2): creative, web_presence
```

### Command Tier - 24 Agents (unchanged)

Full suite including advanced forecasting agents.

```text
Command ($5,497) - 24 Agents:
├── Customer Portal (4): triage, booking, followup, review
├── Field Operations (4): dispatch, route, eta, checkin
├── Business Operations (4): admin, quoting, invoice, inventory
├── Marketing & Sales (3): campaign, lead, marketing
├── Social Media (3): social_content, social_scheduler, social_analytics
├── Analytics (4): insights, performance, revenue, forecast  ← FULL
└── Creative & Web (2): creative, web_presence
```

---

## Console Assignments

| Console | Starter | Scheduling | Growth | Business | Field Ops | Performance | Command |
|---------|---------|------------|--------|----------|-----------|-------------|---------|
| Customer Portal | - | Yes | Yes | Yes | Yes | Yes | Yes |
| Outreach & Sales | - | - | Yes | Yes | Yes | Yes | Yes |
| Social Media | - | - | Yes | Yes | Yes | Yes | Yes |
| Creative & Web | - | - | - | Yes | Yes | Yes | Yes |
| Field Operations | - | - | - | - | Yes | Yes | Yes |
| Business Management | - | - | - | - | Yes | Yes | Yes |
| Analytics & Reports | - | - | - | - | - | Yes | Yes |
| AI Operatives Hub | - | - | - | - | - | - | Yes |
| **Total** | **0** | **1** | **3** | **4** | **6** | **7** | **8** |

---

## Employee Limits (Unchanged)

| Tier | Employees |
|------|-----------|
| Starter | 2 |
| Scheduling | 3 |
| Growth | 5 |
| Business | 8 |
| Field Ops | 15 |
| Performance | 25 |
| Command | 50 |

---

## Files to Update

### 1. src/lib/subscriptionAgentConfig.ts
- Update price strings for all tiers
- Update Performance agents array: remove `revenue`, `forecast`
- Keep Command agents unchanged (24 total)

### 2. src/lib/documentationConfig.ts
- Update `SUBSCRIPTION_TIERS` prices
- Update `annualPrice` (10x monthly)
- Update Performance operatives count: 24 to 22
- Update AI_OPERATIVES tier assignments for revenue/forecast: `performance` to `command`

### 3. src/pages/Index.tsx
- Update all pricing card prices
- Update agent/console counts on Performance card (24 to 22)
- Remove "Priority Support" from Performance features
- Remove "Dedicated Account Manager" from Command features

### 4. src/components/landing/PricingComparisonTable.tsx
- Update price headers
- Update AI Agents row: (1 / 3 / 11 / 12 / 18 / 22 / 24)
- Update feature checkmarks for analytics agents
- Remove Priority Support and Dedicated Account Manager rows

### 5. supabase/functions/ai-agent-chat/index.ts
- Update TIER_AGENTS.performance: remove `revenue`, `forecast`
- Update comments with new prices

### 6. supabase/functions/create-checkout/index.ts
- Update price values in cents for all tiers

---

## Technical Changes Detail

### subscriptionAgentConfig.ts - Performance Tier

```typescript
// BEFORE (24 agents)
performance: {
  agents: [
    'triage', 'booking', 'followup', 'review',
    'dispatch', 'route', 'eta', 'checkin',
    'admin', 'quoting', 'invoice', 'inventory',
    'campaign', 'lead', 'marketing',
    'social_content', 'social_scheduler', 'social_analytics',
    'insights', 'performance', 'revenue', 'forecast',  // ← HAS ALL 4
    'creative', 'web_presence',
  ],
  price: '$3,997/mo',
}

// AFTER (22 agents)
performance: {
  agents: [
    'triage', 'booking', 'followup', 'review',
    'dispatch', 'route', 'eta', 'checkin',
    'admin', 'quoting', 'invoice', 'inventory',
    'campaign', 'lead', 'marketing',
    'social_content', 'social_scheduler', 'social_analytics',
    'insights', 'performance',  // ← ONLY 2 analytics agents
    'creative', 'web_presence',
  ],
  price: '$3,497/mo',
}
```

### create-checkout/index.ts - Price Updates

```typescript
// New prices in cents
starter:     { price: 19700 },   // $197 (unchanged)
scheduling:  { price: 39700 },   // $397 (was $297)
growth:      { price: 59700 },   // $597 (was $397)
business:    { price: 79700 },   // $797 (was $500)
field_ops:   { price: 149700 },  // $1,497 (was $1,500)
performance: { price: 349700 },  // $3,497 (was $3,997)
command:     { price: 549700 },  // $5,497 (was $5,997)
```

---

## Value Differentiation Summary

### Performance ($3,497/mo)
- 22 AI Agents
- 7 Consoles
- 25 Employees
- Basic Analytics: See what's happening (insights + performance metrics)
- Position: "Run your entire company with visibility"

### Command ($5,497/mo)
- 24 AI Agents (+2 exclusive)
- 8 Consoles (+1 exclusive)
- 50 Employees
- Full Analytics: Predict what's coming (adds revenue + forecast)
- AI Operatives Hub for advanced management
- Position: "AI Operating System with predictive intelligence"

---

## Implementation Order

1. Update configuration files (subscriptionAgentConfig.ts, documentationConfig.ts)
2. Update landing page UI (Index.tsx, PricingComparisonTable.tsx)
3. Update backend edge functions (ai-agent-chat, create-checkout)
4. Note: Stripe Price IDs will need to be updated separately in Stripe Dashboard

