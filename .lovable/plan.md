
# 7-Tier Subscription Restructure Plan

## Overview

Restructure the current 7-tier subscription system to use ChatGPT's proposed naming convention while maintaining your existing agents and using **Option B** (industry templates at signup, not separate industry tiers). This plan also fixes the console access issues where agents were unlocked but their management consoles were not.

---

## Current vs New Tier Names

| Current Name | New Name | Price |
|--------------|----------|-------|
| Aura Express | **Aura Starter** | $197/mo |
| Aura Flow | **Aura Scheduling** | $297/mo |
| Aura Halo | **Aura Growth** | $397/mo |
| Aura Core | **Aura Business** | $500/mo |
| Single-Point | **Aura Field Ops** | $1,500/mo |
| Multi-Track | **Aura Performance** | $3,997/mo |
| Aura Pro Command | **Aura Command** | $5,997/mo |

---

## Agent Bundle System (Using Your 24 Existing Agents)

The ChatGPT proposal groups agents into "stacks" (bundles). Here's how your actual 24 agents map to these bundles:

### Lead Capture Stack (5 capabilities → 1 agent)
```text
triage (AI Receptionist) - handles voice, text, chat widget, smart links, lead triage
```

### Booking Automation Stack (2 agents)
```text
booking (Scheduling Agent) - calendar management, appointment creation
followup (Follow-up Agent) - email/SMS reminders, appointment follow-ups
```

### Marketing Automation Stack (8 agents)
```text
review (Review Agent) - review collection and management
campaign (Campaign Agent) - email/SMS campaign management
lead (Lead Agent) - lead qualification and scoring
marketing (Marketing Agent) - segments, promo codes, referrals
creative (Creative Agent) - content generation
social_content (Social Media Agent) - platform content creation
social_scheduler (Social Media Scheduler) - post scheduling
social_analytics (Social Media Analytics) - engagement metrics
```

### Office Automation Stack (1 agent)
```text
web_presence (Web Presence Agent) - website/blog/SEO management
```

### Field Operations Stack (6 agents)
```text
dispatch (Dispatch Agent) - technician assignment
route (Route Agent) - route optimization
eta (ETA Agent) - arrival time notifications
checkin (Check-in Agent) - job tracking
quoting (Quoting Agent) - quote generation
invoice (Invoice Agent) - billing and payments
```

### Business Intelligence Stack (5 agents)
```text
admin (Admin Agent) - user/company management
inventory (Inventory Agent) - stock tracking
insights (Insights Agent) - business intelligence
performance (Performance Agent) - team metrics
revenue (Revenue Agent) - financial analysis
forecast (Forecast Agent) - demand predictions
```

---

## Complete Tier-to-Agent Mapping

```text
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ TIER             │ PRICE    │ AGENTS │ BUNDLES INCLUDED                                    │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ Aura Starter     │ $197     │   1    │ Lead Capture                                        │
│ Aura Scheduling  │ $297     │   3    │ Lead Capture + Booking                              │
│ Aura Growth      │ $397     │  11    │ Lead Capture + Booking + Marketing                  │
│ Aura Business    │ $500     │  12    │ Lead Capture + Booking + Marketing + Office         │
│ Aura Field Ops   │ $1,500   │  18    │ Above + Field Operations                            │
│ Aura Performance │ $3,997   │  24    │ Above + Business Intelligence                       │
│ Aura Command     │ $5,997   │  24    │ All + Priority Support + Dedicated Manager          │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Detailed Agent List Per Tier

**Aura Starter ($197)** - 1 agent
- triage

**Aura Scheduling ($297)** - 3 agents
- triage, booking, followup

**Aura Growth ($397)** - 11 agents
- triage, booking, followup, review
- campaign, lead, marketing
- social_content, social_scheduler, social_analytics
- creative

**Aura Business ($500)** - 12 agents
- All from Growth + web_presence

**Aura Field Ops ($1,500)** - 18 agents
- All from Business
- dispatch, route, eta, checkin, quoting, invoice

**Aura Performance ($3,997)** - 24 agents
- All from Field Ops
- admin, inventory, insights, performance, revenue, forecast

**Aura Command ($5,997)** - 24 agents
- All agents (same as Performance)
- Dedicated account manager
- Priority support
- Multi-location support

---

## Console Access (FIXED)

The key fix: **consoles now unlock when their agents are available**.

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ CONSOLE                    │ Starter │ Scheduling │ Growth │ Business │ Field Ops │ Performance │ Command │
├────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Customer Portal            │    —    │     ✓      │   ✓    │    ✓     │     ✓     │      ✓      │    ✓    │
│ Outreach & Sales Ops       │    —    │     —      │   ✓    │    ✓     │     ✓     │      ✓      │    ✓    │
│ Social Media Ops           │    —    │     —      │   ✓    │    ✓     │     ✓     │      ✓      │    ✓    │
│ Creative & Web Presence    │    —    │     —      │   —    │    ✓     │     ✓     │      ✓      │    ✓    │
│ Field Operations           │    —    │     —      │   —    │    —     │     ✓     │      ✓      │    ✓    │
│ Business Management        │    —    │     —      │   —    │    —     │     ✓     │      ✓      │    ✓    │
│ Analytics & Reports        │    —    │     —      │   —    │    —     │     —     │      ✓      │    ✓    │
├────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ TOTAL CONSOLES             │    0    │     1      │   3    │    4     │     6     │      7      │    7    │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Key Fixes:**
1. **Scheduling tier** now gets Customer Portal Console (has booking/followup agents)
2. **Growth tier** gets 3 consoles (Customer Portal, Outreach & Sales, Social Media) - aligns with having those agents
3. **Business tier** adds Creative & Web Presence console (has web_presence agent)
4. **Field Ops tier** adds Field Operations + Business Management (has dispatch, quoting, invoice)
5. **Performance tier** adds Analytics & Reports (has insights, performance, revenue, forecast)

---

## Employee Limits

| Tier | Employees Included | Additional |
|------|-------------------|------------|
| Starter | 2 | $10/employee |
| Scheduling | 3 | $10/employee |
| Growth | 5 | $10/employee |
| Business | 8 | $10/employee |
| Field Ops | 15 | $10/employee |
| Performance | 25 | $10/employee |
| Command | 50 | $10/employee |

---

## Industry Templates (Option B Implementation)

At signup or in settings, users select their industry. This customizes:
- Onboarding wizard questions
- Knowledge base default content
- Creative Agent prompts and tone
- Social media post templates
- Example services in the system

**Supported Industries:**
- HVAC / Plumbing / Electrical
- Solar / Roofing / Fencing
- Landscaping / Pools / Pest Control
- Appliance Repair / Cleaning / Construction
- Auto Care / Security Systems
- Real Estate
- Beauty & Wellness
- Restaurants / Food Service
- Personal Assistants / Professional Services

This is configured in a new `industry_vertical` column on the `companies` table.

---

## Communication Channels

| Channel | Starter | Scheduling | Growth | Business | Field Ops | Performance | Command |
|---------|---------|------------|--------|----------|-----------|-------------|---------|
| Message Aura (Text) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Talk to Aura (Voice) | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ |
| Email Reminders | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| SMS Reminders | — | ✓ | ✓ | — | ✓ | ✓ | ✓ |

**Note:** Aura Business ($500) is positioned as a "digital-only" tier without voice, targeting businesses that primarily need web/social presence. This maintains backward compatibility with your existing Core tier positioning.

---

## Technical Implementation

### Phase 1: Configuration Files

**File: `src/lib/documentationConfig.ts`**
- Rename tier IDs: express→starter, aura_flow→scheduling, halo→growth, core→business, single_point→field_ops, multi_track→performance, command→command
- Update tier names, descriptions, and bestFor text
- Update agent counts and console counts per tier
- Update employee limits

**File: `src/lib/subscriptionAgentConfig.ts`**
- Update `SubscriptionTier` type with new tier IDs
- Update `TIER_AGENT_CONFIG` with corrected agent lists
- Update `TIER_HIERARCHY` ordering
- Update console assignments to match agent availability

### Phase 2: Edge Function Updates

**File: `supabase/functions/ai-agent-chat/index.ts`**
- Update `TIER_AGENTS` mapping with new tier IDs and agent lists
- Update `getRequiredTierForAgent` helper logic

**File: `supabase/functions/create-checkout/index.ts`**
- Update `SUBSCRIPTION_TIERS` with new tier IDs and names
- Create new Stripe products/prices for renamed tiers OR update metadata

**File: `supabase/functions/check-subscription/index.ts`**
- Update tier validation logic with new tier IDs

### Phase 3: UI Updates

**File: `src/pages/Index.tsx`**
- Update pricing card names and descriptions
- Update hero section copy to match ChatGPT's proposed copy
- Group cards into sections: "Start Your AI Journey" (Starter-Business) and "Scale Your Operations" (Field Ops-Command)

**File: `src/components/landing/PricingComparisonTable.tsx`**
- Update column headers with new tier names
- Update section title from "AI Agents (1/7/12/8/12/18/24)" to "AI Agent Stacks"
- Add "Lead Capture Stack", "Booking Automation Stack" etc. as row groupings
- Update employee counts and console counts

**File: `src/pages/Subscription.tsx`**
- Update tier selection UI with new names
- Update upgrade path descriptions

### Phase 4: Database Migration

Since `subscription_tier` is stored as TEXT (not enum), the migration is straightforward:

```sql
-- Update existing companies to new tier names
UPDATE companies SET subscription_tier = 'starter' WHERE subscription_tier = 'express';
UPDATE companies SET subscription_tier = 'scheduling' WHERE subscription_tier = 'aura_flow';
UPDATE companies SET subscription_tier = 'growth' WHERE subscription_tier = 'halo';
UPDATE companies SET subscription_tier = 'business' WHERE subscription_tier = 'core';
UPDATE companies SET subscription_tier = 'field_ops' WHERE subscription_tier = 'single_point';
UPDATE companies SET subscription_tier = 'performance' WHERE subscription_tier = 'multi_track';
-- command stays as command

-- Add industry_vertical column for Option B
ALTER TABLE companies ADD COLUMN IF NOT EXISTS industry_vertical TEXT DEFAULT 'general';
```

### Phase 5: Stripe Product Updates

Either:
1. **Create new products** in Stripe with new names (Aura Starter, Aura Scheduling, etc.) and update price IDs in code
2. **OR** Keep existing products and just update display names in Stripe dashboard

---

## Files Requiring Changes

| File | Changes |
|------|---------|
| `src/lib/documentationConfig.ts` | Tier definitions, names, agents, consoles |
| `src/lib/subscriptionAgentConfig.ts` | Type definitions, agent/console mappings |
| `supabase/functions/ai-agent-chat/index.ts` | TIER_AGENTS gating logic |
| `supabase/functions/create-checkout/index.ts` | Stripe price IDs, tier names |
| `supabase/functions/check-subscription/index.ts` | Tier validation |
| `src/pages/Index.tsx` | Pricing UI, hero copy |
| `src/components/landing/PricingComparisonTable.tsx` | Comparison table |
| `src/pages/Subscription.tsx` | Subscription management UI |
| Database migration | Tier name updates, industry_vertical column |

---

## Summary of Key Changes

1. **Tier Naming**: Express→Starter, Flow→Scheduling, Halo→Growth, Core→Business, Single-Point→Field Ops, Multi-Track→Performance
2. **Console Access Fix**: Consoles now properly align with agent availability (e.g., Scheduling gets Customer Portal)
3. **Agent Bundling**: Agents grouped into logical "stacks" for clearer marketing
4. **Industry Templates**: Option B implemented via `industry_vertical` column - same features, customized content
5. **Employee Limits**: Updated to ChatGPT's proposed structure (2/3/5/8/15/25/50)
6. **Voice Channel**: Business tier ($500) remains voice-disabled (digital-only positioning)
