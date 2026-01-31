

# Add Aura Flow Subscription Tier

## Overview
Add a new subscription tier called **Aura Flow** at $297/month, positioned between Aura Express ($197) and Aura Halo ($397). This tier combines voice/chat capabilities with scheduling automation for businesses that need appointment booking via direct calendar sync (no customer portal required).

## Tier Details

| Attribute | Value |
|-----------|-------|
| Name | Aura Flow |
| ID | `aura_flow` |
| Price | $297/month |
| Annual Price | $2,970/year (saves $594) |
| Implementation Fee | $399 |
| Employees | 2 |
| Operatives | 4 |
| Consoles | 0 (calendar sync only) |

### Features Included
- AI Receptionist (24/7 customer engagement)
- Message Aura (Text chat)
- Talk to Aura (Voice conversations)
- Smart Link Sharing (Website, Menu, Booking links)
- Scheduling Agent (direct calendar sync - no portal needed)
- Follow-up Agent (SMS + Email reminders/confirmations)
- Knowledge Base for FAQs

### Key Differentiator
Unlike Halo which includes the Customer Portal console, Aura Flow focuses on calendar-sync-only scheduling - the AI books appointments directly to the business calendar without a customer-facing portal interface.

## Files to Update

### 1. `src/lib/documentationConfig.ts`
- Add `aura_flow` tier to `SUBSCRIPTION_TIERS`
- Update `TIER_ORDER` array

### 2. `src/hooks/useSubscription.ts`
- Add `aura_flow` to `SubscriptionTier` type
- Update `tierOrder` array for hierarchy

### 3. `src/lib/subscriptionAgentConfig.ts`
- Add tier configuration for landing chat agent

### 4. `src/pages/Index.tsx` (Homepage)
- Add pricing card for Aura Flow tier
- Update tier comparison displays

### 5. `src/pages/Subscription.tsx`
- Add subscription card for new tier

### 6. `src/components/documentation/PricingSummaryPDF.tsx`
- Add tier to PDF documentation

### 7. Edge Function: `supabase/functions/landing-chat/index.ts`
- Update with new tier information

## Technical Details

### Tier Position in Hierarchy
```text
express (1) → aura_flow (2) → halo (3) → core (4) → single_point (5) → multi_track (6) → command (7)
```

### New Tier Configuration
```typescript
aura_flow: {
  id: 'aura_flow',
  name: 'Aura Flow',
  price: 297,
  annualPrice: 2970,
  annualSavings: 594,
  implementationFee: 399,
  employees: 2,
  operatives: 4,
  consoles: 0,
  description: 'AI voice, chat, and scheduling with calendar sync.',
  bestFor: 'Service businesses needing automated booking without a customer portal.',
  highlights: [
    'AI Receptionist for 24/7 engagement',
    'Message Aura (Text) + Talk to Aura (Voice)',
    'Smart Link Sharing',
    'Scheduling Agent with calendar sync',
    'Follow-up Agent (SMS + Email)',
    'Knowledge Base for FAQs',
  ],
  hasVoice: true,
  hasAutomation: true,
}
```

### Visual Styling
- Color theme: Teal/cyan gradient (distinct from amber Express and pink Halo)
- Badge: "Flow" indicator

## Implementation Sequence
1. Update `documentationConfig.ts` with tier definition
2. Update `useSubscription.ts` with type and hierarchy
3. Update `subscriptionAgentConfig.ts` for landing chat
4. Update homepage pricing section
5. Update Subscription page
6. Update PDF documentation
7. Update landing-chat edge function

