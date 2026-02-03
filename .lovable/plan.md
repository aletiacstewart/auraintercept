
# Add Core AI Agents to All Subscription Plans

## Overview
This update adds 10 AI agents to every subscription tier, creating a stronger value proposition across all plans:

| Agent Category | Agents Being Added to All Plans |
|----------------|--------------------------------|
| **Customer Engagement** | AI Receptionist (triage) |
| **Outreach & Sales** | Campaign Agent, Lead Agent, Marketing Agent |
| **Social Media** | Social Media Agent, Social Media Scheduler, Social Media Analytics |
| **Creative** | Creative Agent |

---

## Current vs. Proposed Agent Distribution

### Before (Current State)
| Tier | Agents |
|------|--------|
| Express | 0 agents |
| Aura Flow | 3 agents (triage, booking, followup) |
| Core | 0 agents |
| Halo | 3 agents (triage, booking, followup) |
| Single-Point | 3 agents (triage, followup, review) |
| Multi-Track | 10 agents |
| Command | 24 agents (all) |

### After (Proposed)
| Tier | Current | + New | Total | New Agents Added |
|------|---------|-------|-------|------------------|
| Express | 0 | +8 | **8** | triage, campaign, lead, marketing, social_content, social_scheduler, social_analytics, creative |
| Aura Flow | 3 | +7 | **10** | campaign, lead, marketing, social_content, social_scheduler, social_analytics, creative |
| Core | 0 | +8 | **8** | triage, campaign, lead, marketing, social_content, social_scheduler, social_analytics, creative |
| Halo | 3 | +7 | **10** | campaign, lead, marketing, social_content, social_scheduler, social_analytics, creative |
| Single-Point | 3 | +7 | **10** | campaign, lead, marketing, social_content, social_scheduler, social_analytics, creative |
| Multi-Track | 10 | +7 | **17** | campaign, lead, marketing, social_content, social_scheduler, social_analytics, creative |
| Command | 24 | 0 | **24** | (already has all) |

---

## Files to Modify

### 1. `src/lib/subscriptionAgentConfig.ts` (Primary Configuration)
Update `TIER_AGENT_CONFIG` for each tier:

```typescript
express: {
  agents: [
    'triage',  // NEW: AI Receptionist
    'campaign', 'lead', 'marketing',  // NEW: Outreach & Sales
    'social_content', 'social_scheduler', 'social_analytics',  // NEW: Social Media
    'creative'  // NEW: Creative Agent
  ],
  consoles: ['marketing_sales', 'social_media'],  // NEW: Add console access
  ...
},
// Similar updates for aura_flow, core, halo, single_point, multi_track
```

### 2. `src/lib/documentationConfig.ts` (Documentation Source of Truth)
- Update `AI_OPERATIVES` tier assignments (change `tier: 'command'` to `tier: 'express'` for the 8 universal agents)
- Update `SUBSCRIPTION_TIERS` highlights arrays to reflect new inclusions
- Update `CONSOLES` tier assignments for marketing_sales and social_media

### 3. `src/hooks/useSubscription.ts`
- Update `TIER_FEATURES` to include new capabilities for lower tiers

### 4. PDF Export Files (Reflect New Configuration)
- `PricingSummaryPDF.tsx` - Update tier comparison tables
- `AIAgentGuidesPDF.tsx` - Update agent-to-tier mappings
- `ComprehensiveGuidesPDF.tsx` - Update tier descriptions

---

## Console Access Updates

With the new agents, these consoles need to be available at lower tiers:

| Console | Current Min Tier | New Min Tier |
|---------|------------------|--------------|
| Outreach & Sales Ops | Command | Express |
| Social Media Ops | Command | Express |
| Creative & Web Presence | Command | Express (partial) |

---

## Technical Implementation Steps

### Step 1: Update subscriptionAgentConfig.ts
Add the 8 universal agents to each tier's `agents` array and update `consoles` arrays.

### Step 2: Update documentationConfig.ts
- Change tier assignments for: `triage`, `campaign`, `lead`, `marketing`, `social_content`, `social_scheduler`, `social_analytics`, `creative`
- Update tier highlights to include new features

### Step 3: Update Console Tier Requirements
- `marketing_sales` console: Change tier from `command` to `express`
- `social_media` console: Change tier from `command` to `express`

### Step 4: Update PDFs
All PDF exports will automatically pull from the updated config (per previous synchronization work).

---

## Validation Checklist

After implementation:
- [ ] All 7 tiers show AI Receptionist in agent list
- [ ] All 7 tiers show Outreach & Sales agents
- [ ] All 7 tiers show Social Media agents
- [ ] All 7 tiers show Creative Agent
- [ ] Sidebar navigation shows Outreach & Sales console for all tiers
- [ ] Sidebar navigation shows Social Media console for all tiers
- [ ] FeatureGate components correctly grant access
- [ ] PDF exports reflect updated agent/tier mappings

---

## Business Impact

This change:
- **Increases value** at every price point
- **Simplifies marketing** - all plans include engagement, marketing, and social tools
- **Creates differentiation** through Field Ops, Analytics, and advanced Business Management (still tier-locked)
- **Reduces friction** - customers don't need to upgrade just to use basic marketing tools
