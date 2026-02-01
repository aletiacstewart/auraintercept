

# Marketing & Sales Console: Agent Clarification Fix

## Problem Summary
The Marketing & Sales Console has overlapping agent descriptions and an inconsistent agent count (2 vs 3) across different configuration files.

## Resolution: Define 3 Distinct Agents

Based on the platform architecture memory, Marketing & Sales should have **3 agents** with clear, distinct purposes:

| Agent ID | Name | Distinct Purpose |
|----------|------|------------------|
| `campaign` | Campaign Agent | **Execution** - Creates and sends email/SMS campaigns, manages campaign scheduling and performance analytics |
| `lead` | Lead Agent | **Pipeline** - Qualifies incoming leads, scores them based on engagement, automates follow-up sequences |
| `marketing` | Marketing Agent | **Segmentation** - Manages customer segments, promo codes, referral tracking, and win-back targeting |

## Changes Required

### 1. Add Lead Agent to documentationConfig.ts

Add the missing Lead Agent definition to the AI_OPERATIVES array:

```typescript
// Marketing & Sales Console - 3 agents (update comment)
{
  id: 'lead',
  name: 'Lead Agent',
  description: 'Qualifies and scores incoming leads based on engagement. Automates follow-up sequences to move leads through the pipeline.',
  console: 'marketing_sales',
  tier: 'command',
  dependencies: [],
  isCore: false,
  worksAlone: true,
},
```

### 2. Update Index.tsx Agent Descriptions

Clarify the distinct purposes in the landing page:

```typescript
{
  name: 'Campaign Agent',
  description: 'Creates and schedules email and SMS marketing campaigns with performance analytics',
  icon: Megaphone
}, {
  name: 'Lead Agent', 
  description: 'Qualifies and scores leads with automated follow-up sequences',
  icon: UserPlus
}, {
  name: 'Marketing Agent',
  description: 'Manages customer segments, promo codes, and referral programs',
  icon: Target
}
```

### 3. Update Edge Function (ai-agent-chat)

Change `'promo'` to `'marketing'` to match standardized naming.

## Files to Modify

| File | Change |
|------|--------|
| `src/lib/documentationConfig.ts` | Add Lead Agent definition, update comment to "3 agents" |
| `src/pages/Index.tsx` | Update agent descriptions to be distinct |
| `supabase/functions/ai-agent-chat/index.ts` | Replace `promo` with `marketing` |

## Result After Fix

Marketing & Sales Console will have **3 clearly distinct agents**:
1. **Campaign Agent** - Campaign execution and delivery
2. **Lead Agent** - Lead qualification and nurturing  
3. **Marketing Agent** - Segmentation and promotions

Total AI Operatives will increase from 22 to **23** (matching the "23 Specialized AI Operatives" marketing messaging).

