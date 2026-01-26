
## Remove Enterprise Plan & Setup Multi-Tier Stripe Subscriptions

### Summary
Replace the outdated "Enterprise Company Subscription" with your actual 5-tier subscription structure: **Halo ($397)**, **Core ($500)**, **Single-Point ($1,500)**, **Multi-Track ($3,997)**, and **Pro Command ($5,997)**.

---

### Current State Analysis

| Component | Current State | Issue |
|-----------|---------------|-------|
| `create-checkout` Edge Function | Hardcoded to "Enterprise" at $250/mo | Only one plan, wrong price |
| `check-subscription` Edge Function | Has placeholder price mappings | Price IDs don't exist in Stripe |
| Stripe Products | "Enterprise Company Subscription" | Wrong product structure |
| Stripe Prices | Only $250/mo price exists | Missing all 5 tier prices |
| Subscription UI | Shows 4 tiers (Core, Single-Point, Multi-Track, Command) | Missing Halo tier, no tier selection in checkout |

---

### Implementation Plan

#### Step 1: Create Stripe Products & Prices

Create 5 new products with monthly recurring prices in Stripe:

| Tier | Price | Product Name |
|------|-------|--------------|
| Halo | $397/mo | Aura Halo |
| Core | $500/mo | Aura Core |
| Single-Point | $1,500/mo | Single-Point |
| Multi-Track | $3,997/mo | Multi-Track |
| Pro Command | $5,997/mo | Aura Pro Command |

#### Step 2: Update `create-checkout` Edge Function

Replace the single Enterprise plan with a tier configuration object and accept a `tier` parameter from the frontend:

```typescript
// New tier configuration with real Stripe Price IDs
const SUBSCRIPTION_TIERS = {
  halo: {
    price_id: "price_xxx", // Will be created
    name: "Aura Halo",
    price: 39700, // $397 in cents
  },
  core: {
    price_id: "price_xxx",
    name: "Aura Core", 
    price: 50000, // $500 in cents
  },
  single_point: {
    price_id: "price_xxx",
    name: "Single-Point",
    price: 150000, // $1,500 in cents
  },
  multi_track: {
    price_id: "price_xxx",
    name: "Multi-Track",
    price: 399700, // $3,997 in cents
  },
  command: {
    price_id: "price_xxx",
    name: "Aura Pro Command",
    price: 599700, // $5,997 in cents
  },
};
```

**Key Changes:**
- Accept `tier` parameter from request body
- Validate tier exists in configuration
- Use correct price_id based on selected tier
- Store tier in checkout session metadata

#### Step 3: Update `check-subscription` Edge Function

Update the price-to-tier mapping with the real Stripe price IDs created in Step 1.

#### Step 4: Update Subscription UI (`src/pages/Subscription.tsx`)

- Add **Aura Halo** tier card to the tier list
- Modify `handleSubscribe` to accept a tier parameter
- Add "Subscribe" button to each tier card that passes the tier ID
- Highlight current subscription tier with visual indicators

#### Step 5: Clean Up Old Products (Optional)

After testing, the old Enterprise products can be archived in Stripe Dashboard.

---

### Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/create-checkout/index.ts` | Replace Enterprise config with 5-tier config, accept tier param |
| `supabase/functions/check-subscription/index.ts` | Update price-to-tier mapping with real IDs |
| `src/pages/Subscription.tsx` | Add Halo tier, add per-tier subscribe buttons |

---

### Technical Notes

1. **Stripe Price Creation**: I'll use the Stripe tools to create the products and prices, which will give us the actual price IDs to use in the code.

2. **Backward Compatibility**: The updated `check-subscription` will continue to map the old Enterprise price ID to "command" tier for any existing subscribers.

3. **No Webhooks Needed**: Following your existing pattern, subscription status is checked on-demand via the `check-subscription` function.

4. **Customer Portal**: The existing `stripe-customer-portal` function will continue to work for subscription management (upgrades/downgrades handled through Stripe's portal).
