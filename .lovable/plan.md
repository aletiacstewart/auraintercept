
# Help Pages Update Plan

## Summary
The Help & Documentation pages are missing console configurations and AI agent help content. Two consoles are missing from the help config, and the AI Help Center needs more comprehensive agent-specific assistance.

## Issues Identified

### 1. Missing Consoles in Help Config (src/lib/helpContentConfig.ts)

The `CONSOLE_HELP_CONFIG` array has only 6 consoles but needs 8 to match the subscription config:

| Console ID | Status | Required Tier |
|------------|--------|---------------|
| customer_portal | Present | scheduling |
| field_operations | Present | field_ops |
| business_management | Present | field_ops |
| marketing_sales | Present | growth |
| social_media | Present | growth |
| creative_web_presence | **MISSING** | business |
| analytics_reports | Present | performance |
| ai_operatives_hub | **MISSING** | command |

### 2. Console Count Mismatch

`TIER_CONSOLE_COUNTS` in helpContentConfig.ts shows command tier has 7 consoles but should be 8 (includes AI Operatives Hub).

### 3. AI Help Center System Prompt Outdated

The `AIHelpCenter.tsx` SYSTEM_PROMPT needs more detailed agent descriptions for each of the 24 agents.

## Implementation Details

### Step 1: Add Creative & Web Presence Console
Add to `CONSOLE_HELP_CONFIG` array:

```text
New Console Config:
┌────────────────────────────────────────────────────────┐
│ id: 'creative_web_presence'                            │
│ title: 'Creative & Web Presence'                       │
│ icon: Palette                                          │
│ requiredTier: 'business'                               │
│ description: Content Engine + Website/Blog Management  │
├────────────────────────────────────────────────────────┤
│ tabs: ['Content Engine', 'Web Presence', 'Blog']       │
├────────────────────────────────────────────────────────┤
│ agents:                                                │
│   - Creative Agent (growth)                            │
│   - Web Presence Agent (business)                      │
├────────────────────────────────────────────────────────┤
│ features:                                              │
│   - Multi-channel content generation                   │
│   - AI website builder                                 │
│   - Blog management                                    │
│   - SEO optimization                                   │
│   - Content calendar                                   │
│   - Brand voice integration                            │
└────────────────────────────────────────────────────────┘
```

### Step 2: Add AI Operatives Hub Console
Add to `CONSOLE_HELP_CONFIG` array:

```text
New Console Config:
┌────────────────────────────────────────────────────────┐
│ id: 'ai_operatives_hub'                                │
│ title: 'AI Operatives Hub'                             │
│ icon: Bot                                              │
│ requiredTier: 'command'                                │
│ description: Central management for all 24 AI agents   │
├────────────────────────────────────────────────────────┤
│ tabs: ['Operatives', 'Quick Start', 'Monitor',         │
│        'Analytics', 'History']                         │
├────────────────────────────────────────────────────────┤
│ agents:                                                │
│   - All 24 Operatives (view/manage)                    │
├────────────────────────────────────────────────────────┤
│ features:                                              │
│   - Individual agent management                        │
│   - Batch activation                                   │
│   - Dependency visualization                           │
│   - Real-time event monitoring                         │
│   - Performance metrics                                │
│   - Conversation history browser                       │
└────────────────────────────────────────────────────────┘
```

### Step 3: Update Console Counts
Update `TIER_CONSOLE_COUNTS`:

| Tier | Current | Corrected |
|------|---------|-----------|
| command | 7 | 8 |

### Step 4: Update AI Help Center System Prompt
Expand `SYSTEM_PROMPT` with comprehensive agent coverage:

**Agent Descriptions to Add:**

| Category | Agents | Help Topics |
|----------|--------|-------------|
| Lead Capture | Triage (AI Receptionist) | 24/7 answering, lead capture, routing |
| Booking | Scheduling, Follow-up | Calendar sync, reminders, confirmations |
| Marketing | Campaign, Lead, Marketing, Review | Campaigns, segmentation, promos, referrals |
| Social Media | Social Content, Scheduler, Analytics | 6 platforms, scheduling, metrics |
| Creative | Creative, Web Presence | Content Engine, website, blog, SEO |
| Field Ops | Dispatch, Route, ETA, Check-in | GPS, job assignment, notifications |
| Business Ops | Admin, Quoting, Invoice, Inventory | Quotes, invoices, stock management |
| Analytics | Insights, Performance, Revenue, Forecast | KPIs, forecasting, exports |

### Step 5: Add Missing Icon Import
Add `Bot` and `Palette` icon imports to helpContentConfig.ts

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/helpContentConfig.ts` | Add 2 console configs, fix console counts, add icon imports |
| `src/components/help/AIHelpCenter.tsx` | Expand SYSTEM_PROMPT with detailed agent help |

## Technical Changes Summary

### helpContentConfig.ts
1. Add import for `Bot` and `Palette` icons
2. Add `creative_web_presence` console config with:
   - 2 agents (Creative, Web Presence)
   - 10+ features covering content engine and web management
   - 8+ example prompts
3. Add `ai_operatives_hub` console config with:
   - All agents listed as manageable
   - 10+ features for agent orchestration
   - 8+ example prompts
4. Update `TIER_CONSOLE_COUNTS.command` from 7 to 8

### AIHelpCenter.tsx
1. Expand SYSTEM_PROMPT to include:
   - All 24 agent names with specific capabilities
   - Console navigation paths
   - Feature-specific guidance
   - Tier-specific agent availability
   - Common troubleshooting scenarios

## Verification Steps
After implementation:
1. Navigate to Help page and verify Creative & Web Presence console appears
2. Verify AI Operatives Hub appears for command tier users
3. Test AI Help Center with agent-specific questions
4. Verify console selector shows all 8 consoles at command tier
