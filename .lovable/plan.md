

# Comprehensive Platform Fixes and Enhancements Implementation Plan

## Executive Summary

This plan addresses all critical fixes and feature enhancements identified in the platform audit, excluding warranty-related features as requested. The implementation is organized into 4 phases based on priority and dependencies.

---

## Phase 1: Critical Stripe & Subscription Fixes

### 1.1 Create Aura Flow Product in Stripe

**Issue**: The `aura_flow` tier ($297/mo) is completely missing from Stripe - no product or price exists.

**Action**: Use Stripe tools to create the missing product and price.

| Field | Value |
|-------|-------|
| Product Name | Aura Flow |
| Description | AI voice, chat, and scheduling with calendar sync |
| Price | $297/month ($29,700 cents) |
| Recurring | Monthly |

### 1.2 Update create-checkout Edge Function

**File**: `supabase/functions/create-checkout/index.ts`

**Current State**: Missing `aura_flow` tier (only has 6 tiers: express, halo, core, single_point, multi_track, command)

**Changes**:
```text
Line 16-47: Add aura_flow to SUBSCRIPTION_TIERS

const SUBSCRIPTION_TIERS = {
  express: { ... },
  aura_flow: {                    // NEW
    price_id: "[new_price_id]",   // From Stripe creation
    name: "Aura Flow",
    price: 29700,                 // $297 in cents
  },
  halo: { ... },
  core: { ... },
  // ... rest unchanged
};
```

### 1.3 Update check-subscription Edge Function

**File**: `supabase/functions/check-subscription/index.ts`

**Changes**:
```text
Line 16-26: Add aura_flow to PRICE_TO_TIER mapping

const PRICE_TO_TIER = {
  "price_1SuzwwJ9fo9y8fGH0rJZBw5q": "express",
  "[new_aura_flow_price_id]": "aura_flow",  // NEW
  "price_1StwXbJ9fo9y8fGHMaCGdnDV": "halo",
  // ... rest unchanged
};
```

---

## Phase 2: AI Agent & Orchestrator Cleanup

### 2.1 Clean Up Legacy Agents in Orchestrator

**File**: `supabase/functions/ai-orchestrator/index.ts`

**Issue**: Legacy agent types exist that are not in the current tier structure:
- `promo` - replaced by `marketing` agent
- `referral` - merged into `marketing` agent
- `winback` - merged into `marketing` agent  
- `seasonal` - merged into `marketing` agent
- `analytics` - redundant with `insights` agent

**Changes**:
```text
Lines 29-42: Update AGENT_TYPES to remove legacy agents

Remove:
- promo, referral, winback, seasonal (Phase 4 marketing_sales)
- analytics (Phase 5 - duplicate of insights)

Update routing:
- 'churn_risk_detected' routes to ['marketing'] instead of ['winback']
- 'seasonal_trigger' routes to ['marketing'] instead of ['seasonal']
```

### 2.2 Add Missing Tools to AI Agent

**File**: `supabase/functions/ai-agent/index.ts`

**New Tools to Add**:
1. `escalate_to_human` - Transfer conversation to human support
2. `lookup_lead` - Search and qualify leads from CRM data

**Tool Definitions**:
```text
After line 285, add new tools:

{
  type: "function",
  function: {
    name: "escalate_to_human",
    description: "Transfer conversation to human support agent",
    parameters: {
      type: "object",
      properties: {
        reason: { type: "string", description: "Reason for escalation" },
        priority: { type: "string", enum: ["low", "medium", "high"] },
        customer_info: { type: "string", description: "Summary of customer issue" }
      },
      required: ["reason"]
    }
  }
},
{
  type: "function", 
  function: {
    name: "lookup_lead",
    description: "Search for leads by phone, email, or name",
    parameters: {
      type: "object",
      properties: {
        phone: { type: "string" },
        email: { type: "string" },
        name: { type: "string" }
      },
      required: []
    }
  }
}
```

**Implementation Functions**:
```text
After line 462, add implementations:

case "escalate_to_human":
  return await escalateToHuman(supabase, companyId, args);
case "lookup_lead":
  return await lookupLead(supabase, companyId, args);
```

---

## Phase 3: Analytics Dashboard Completion

### 3.1 Current Analytics State

**Directory**: `src/components/analytics/`

**Existing Components**:
- AnalyticsAgentConsole.tsx
- BlogAnalytics.tsx
- CampaignsAnalytics.tsx
- CompanyAnalytics.tsx
- PlatformAnalytics.tsx
- RemindersAnalytics.tsx
- SocialMediaAnalytics.tsx
- WidgetAnalytics.tsx

### 3.2 New Analytics Components Needed

Create 4 new components to complete the Analytics & Reports console (8 tabs total):

| Component | Purpose |
|-----------|---------|
| `RevenueAnalytics.tsx` | Revenue trends, payment tracking, service revenue breakdown |
| `PerformanceAnalytics.tsx` | Agent performance metrics, response times, success rates |
| `ForecastAnalytics.tsx` | Demand forecasting, capacity planning, trend predictions |
| `InsightsAnalytics.tsx` | Natural language business queries interface |

### 3.3 Analytics Export Feature

**New Feature**: Add CSV/PDF export to all analytics components

**Implementation**:
- Add export button to each analytics component header
- Support CSV format for data export
- Use existing `@react-pdf/renderer` for PDF reports

---

## Phase 4: New Feature Recommendations

### 4.1 Sentiment Analysis Agent (Future Enhancement)

**Purpose**: Analyze customer sentiment across conversations, reviews, and feedback

**Components**:
- New agent type: `sentiment` in orchestrator
- Sentiment scoring for all customer interactions
- Dashboard widget for sentiment trends
- Alert system for negative sentiment spikes

### 4.2 Predictive Churn Agent (Future Enhancement)

**Purpose**: Use ML to predict customer churn and trigger win-back campaigns

**Components**:
- New agent type: `churn_predictor`
- Engagement scoring algorithm
- Auto-trigger marketing campaigns for at-risk customers
- Integration with existing marketing agent

### 4.3 Integration Opportunities

| Integration | Benefit | Priority |
|-------------|---------|----------|
| WhatsApp Business API | Additional messaging channel | High |
| QuickBooks/Xero | Accounting sync for invoices | Medium |
| Zapier Webhooks | No-code automation connector | Medium |

---

## Phase 5: Database Improvements

### 5.1 New Tables for Usage Tracking

**Table**: `subscription_usage_tracking`
```text
- id (uuid, primary key)
- company_id (uuid, foreign key)
- month_year (text)
- ai_requests (integer)
- voice_minutes (integer)
- sms_sent (integer)
- emails_sent (integer)
- created_at (timestamp)
```

### 5.2 Agent Performance Metrics

**Table**: `agent_performance_metrics`
```text
- id (uuid, primary key)
- company_id (uuid, foreign key)
- agent_type (text)
- date (date)
- requests_handled (integer)
- avg_response_time_ms (integer)
- success_rate (decimal)
- handoff_count (integer)
```

---

## Implementation Order

```text
+------------------+     +------------------+     +------------------+
| Phase 1          |---->| Phase 2          |---->| Phase 3          |
| Stripe/Subs Fix  |     | Agent Cleanup    |     | Analytics        |
| (2-3 hours)      |     | (2-3 hours)      |     | (4-6 hours)      |
+------------------+     +------------------+     +------------------+
                                                          |
                                                          v
                              +------------------+     +------------------+
                              | Phase 5          |<----| Phase 4          |
                              | Database         |     | New Features     |
                              | (1-2 hours)      |     | (Optional)       |
                              +------------------+     +------------------+
```

---

## Files to Modify Summary

| File | Changes | Priority |
|------|---------|----------|
| `supabase/functions/create-checkout/index.ts` | Add aura_flow tier | Critical |
| `supabase/functions/check-subscription/index.ts` | Add aura_flow price mapping | Critical |
| `supabase/functions/ai-orchestrator/index.ts` | Remove legacy agents, update routing | High |
| `supabase/functions/ai-agent/index.ts` | Add escalate_to_human, lookup_lead tools | High |
| `src/components/analytics/RevenueAnalytics.tsx` | New component | Medium |
| `src/components/analytics/PerformanceAnalytics.tsx` | New component | Medium |
| `src/components/analytics/ForecastAnalytics.tsx` | New component | Medium |
| `src/components/analytics/InsightsAnalytics.tsx` | New component | Medium |

---

## Technical Notes

### Stripe Product Creation
The Aura Flow product and price must be created first using the Stripe tools before updating the edge functions with the new price ID.

### Edge Function Deployment
After modifying edge functions, they will be auto-deployed. Test each function after deployment:
1. `check-subscription` - Verify aura_flow tier detection
2. `create-checkout` - Verify aura_flow checkout session creation

### Database Migrations
New tables for usage tracking and agent metrics require database migrations with appropriate RLS policies.

### Backward Compatibility
- Legacy price IDs remain mapped to maintain existing subscriptions
- Legacy agent types in orchestrator should be deprecated gracefully

