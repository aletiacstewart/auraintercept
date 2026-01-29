

# Add Aura Express Tier for Restaurants

## Overview

Add a new **Aura Express** subscription tier at **$197/month** specifically designed for restaurants. This tier includes:
- Proxy Voice Chat (voice conversations with customers)
- Talk to Aura (text-based chat)
- Smart link sharing capability (website, online menu, online ordering) from knowledge base

This will be positioned as the entry-level tier, appearing next to Aura Halo in the pricing display.

---

## Tier Specification

| Property | Value |
|----------|-------|
| **Name** | Aura Express |
| **Price** | $197/month |
| **Annual** | $1,970/year (save ~$394) |
| **Target** | Restaurants, cafes, food service |
| **Implementation Fee** | $299 |
| **Employees** | 2 |
| **AI Operatives** | 1 (Aura Assistant with link-sharing) |
| **Consoles** | 0 (uses embedded widget only) |

### Features Included
- Talk to Aura (text-based chat)
- Proxy Voice Chat (voice conversations)
- Smart link sharing from knowledge base:
  - Website URL
  - Online menu link
  - Online ordering link
- Embeddable chat widget
- Knowledge base setup

### Required 3rd Party Integrations
- **ElevenLabs** - Required (for Proxy Voice Chat)
- **Twilio** - Required (for voice/SMS)

---

## Files to Modify

### 1. Central Configuration
**`src/lib/documentationConfig.ts`**
- Add `express` tier to `SUBSCRIPTION_TIERS` object
- Update `TIER_ORDER` to include `express` first
- Update `PLATFORM_STATS.startingPrice` to 197
- Update `PLATFORM_STATS.totalTiers` to 6
- Update tier hierarchy in helper functions

### 2. Backend Functions
**`supabase/functions/create-checkout/index.ts`**
- Add `express` tier configuration with new Stripe price ID
- Note: Will need to create Stripe product/price first

**`supabase/functions/check-subscription/index.ts`**
- Add price ID to tier mapping for "express"

### 3. Landing Page
**`src/pages/Index.tsx`**
- Add new Aura Express card styled with an orange/amber gradient (restaurant theme)
- Position it next to Aura Halo
- Include features: Talk to Aura, Proxy Voice Chat, Smart Links
- Badge: "For Restaurants"

### 4. Pricing Comparison Table
**`src/components/landing/PricingComparisonTable.tsx`**
- Add `express` column to all `FeatureRow` interfaces
- Add new column header with orange styling
- Update all feature rows with Express values
- Reorder columns: Express, Halo, Core, Single-Point, Multi-Track, Command

### 5. Business Audit
**`src/components/audit/types.ts`**
- Add `'EXPRESS'` to `TierType`
- Add EXPRESS scores to `TierScores` interface
- Update all question options with EXPRESS tier scoring
- Add EXPRESS tier recommendation

### 6. PDF Documentation (Optional - for consistency)
**`src/components/documentation/PricingSummaryPDF.tsx`**
- Add Aura Express tier details

---

## UI Design for Express Tier Card

```text
┌─────────────────────────────────────────────────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓ Orange gradient bar ▓▓▓▓▓▓▓▓▓▓▓                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [For Restaurants]                                          │
│                                                             │
│  Aura Express              ✓ Talk to Aura (Chat)           │
│  Restaurants • Cafes       ✓ Proxy Voice Chat              │
│                            ✓ Smart Link Sharing            │
│  $197 /month                 (Menu, Ordering, Website)     │
│                                                             │
│                                    [Start Free Trial]       │
│                                                             │
│  See More Details ▼                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Comparison Table Column Updates

Each section will include Express values:

### Communication Channels
| Feature | Express |
|---------|---------|
| Talk to Aura (Text-Based) | ✓ |
| Proxy Voice Chat | ✓ |
| Email Reminders | ✗ |
| SMS Reminders | ✗ |

### Special Feature: Smart Link Sharing
| Feature | Express |
|---------|---------|
| Website Link Sharing | ✓ |
| Online Menu Link | ✓ |
| Online Ordering Link | ✓ |

### Required 3rd Party
| Integration | Express |
|-------------|---------|
| ElevenLabs | Required |
| Twilio | Required |
| Resend | Not Required |
| Stripe | Not Required |

---

## Stripe Setup Required

Before implementation, a Stripe product and price must be created:
- **Product Name**: Aura Express
- **Price**: $197/month (19700 cents)
- **Billing**: Monthly recurring

The price ID will be added to the edge functions after creation.

---

## Technical Notes

1. **Knowledge Base Integration**: The link-sharing feature uses the existing knowledge base system. When restaurants subscribe and configure their knowledge base with website, menu, and ordering URLs, the AI can share these links in conversations.

2. **Tier Hierarchy**: Express is level 1, below Halo (level 2). This affects which features/operatives are available.

3. **Feature Access**: Express tier gets Talk to Aura + Proxy Voice Chat but NO AI operatives (like Receptionist, Follow-up, etc.) and NO consoles.

---

## Summary of Changes

| File | Action |
|------|--------|
| `src/lib/documentationConfig.ts` | Add express tier config |
| `supabase/functions/create-checkout/index.ts` | Add express pricing |
| `supabase/functions/check-subscription/index.ts` | Add price mapping |
| `src/pages/Index.tsx` | Add Express card UI |
| `src/components/landing/PricingComparisonTable.tsx` | Add Express column |
| `src/components/audit/types.ts` | Add EXPRESS tier type |
| `src/components/documentation/PricingSummaryPDF.tsx` | Add to PDF docs |

