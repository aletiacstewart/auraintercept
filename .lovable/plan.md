## Launch Pricing Sale

Roll out a sitewide "Launch Pricing" sale: original prices shown with strikethrough, new sale prices billed by Stripe, onboarding fees also discounted 50% of the new price.

### Pricing Table

| Tier  | Old monthly | **Sale monthly** | Old onboarding | **Sale onboarding** |
|-------|------------:|-----------------:|---------------:|--------------------:|
| Core  | ~~$697~~    | **$497**         | ~~$349~~       | **$249**            |
| Boost | ~~$1,097~~  | **$897**         | ~~$549~~       | **$449**            |
| Pro   | ~~$1,997~~  | **$1,797**       | ~~$999~~       | **$899**            |
| Elite | ~~$3,497~~  | **$3,097**       | ~~$1,749~~     | **$1,549**          |

Label everywhere: **"Launch Pricing"** badge next to the strikethrough.

### Step 1 — Stripe products & prices

Create 8 new Stripe prices (4 monthly recurring + 4 one-time onboarding) at the sale amounts. Old price IDs stay in `PRICE_TO_TIER` map so existing subscribers keep working.

```text
NEW_PRICES = {
  starter:     { monthly: $497  recurring,  onboarding: $249  one-time }
  connect:     { monthly: $897  recurring,  onboarding: $449  one-time }
  performance: { monthly: $1797 recurring,  onboarding: $899  one-time }
  command:     { monthly: $3097 recurring,  onboarding: $1549 one-time }
}
```

### Step 2 — Wire new prices into checkout

- `supabase/functions/create-checkout/index.ts` — swap the 4 `price_id` + 4 `onboarding_price_id` constants to the new IDs.
- `supabase/functions/check-subscription/index.ts` — add the 4 new monthly price IDs to `PRICE_TO_TIER` so the new subs map to the right tier (legacy IDs remain for grandfathered subs).

### Step 3 — Central pricing source of truth

Create `src/lib/launchPricing.ts` exporting:

```text
LAUNCH_PRICING = {
  active: true,
  label: 'Launch Pricing',
  tiers: {
    starter:     { original: 697,  sale: 497,  onboardingOriginal: 349,  onboardingSale: 249 },
    connect:     { original: 1097, sale: 897,  onboardingOriginal: 549,  onboardingSale: 449 },
    performance: { original: 1997, sale: 1797, onboardingOriginal: 999,  onboardingSale: 899 },
    command:     { original: 3497, sale: 3097, onboardingOriginal: 1749, onboardingSale: 1549 },
  }
}
formatPrice(n), SalePrice component (strikethrough + new + "Launch Pricing" chip)
```

The `SalePrice` component renders: ~~$697~~ **$497**/mo · chip "Launch Pricing".

### Step 4 — Replace prices across UI

Swap hardcoded $697 / $1,097 / $1,997 / $3,497 (and onboarding amounts) with `<SalePrice tier=... />` on:

- `src/pages/Auth.tsx` — signup tier picker (4 cards)
- `src/pages/Subscription.tsx` — current plan card, plan grid, comparison table
- `src/pages/Index.tsx` — landing pricing
- `src/pages/ForBusiness.tsx`, `src/pages/Contact.tsx`, `src/pages/Help.tsx`, `src/pages/AIAgentsHub.tsx`, `src/pages/PlatformGuides.tsx`, `src/pages/PublicOnboardingIntake.tsx`
- `src/components/landing/PricingComparisonTable.tsx`
- `src/components/agents/TierComparisonCards.tsx`, `AgentRequirementCalculator.tsx`, `AgentDependencyDiagram.tsx`
- `src/components/marketing/IndustryROICalculator.tsx`
- `src/components/audit/types.ts`
- `src/lib/subscriptionAgentConfig.ts` (`price` field per tier — append sale, keep `originalPrice`)
- `src/lib/diyCostBreakdown.ts` (build('core', …, 697) → 497, etc.)
- `src/lib/documentationConfig.ts`

### Step 5 — Update PDF / document generators

Update price constants in:

- `PricingSummaryPDF.tsx`, `ComprehensiveGuidesPDF.tsx`, `MarketingSalesMasterPDF.tsx`, `SalesPitchDataPDF.tsx`, `CompanyOnboardingPDF.tsx`, `WebsiteCopyPDF.tsx`, `VideoScriptsPDF.tsx`, `SocialMediaContentPackPDF.tsx`, `PlatformFAQPDF.tsx`, `BrandAssetGuidePDF.tsx`, `AIAgentGuidesPDF.tsx`, `ExportDocumentation.tsx`
- `src/pages/TermsOfService.tsx` (fee references)

PDFs render with strikethrough on the old price and bold sale price + "Launch Pricing" tagline.

### Step 6 — AI prompts & edge functions

- `supabase/functions/landing-chat/index.ts`, `supabase/functions/ai-agent-chat/index.ts`, `supabase/functions/trial-reminders/index.ts`
- `src/lib/helpSystemPrompt.ts`

Replace the embedded pricing paragraphs so Aura quotes sale prices and mentions "Launch Pricing" with original price for context.

### Step 7 — Memory update

Update `mem://index.md` Core rule + `mem://marketing/pricing/canonical-four-tier-model` to record:
- Launch Pricing active: Core $497 (was $697), Boost $897 (was $1,097), Pro $1,797 (was $1,997), Elite $3,097 (was $3,497).
- Onboarding 50% of sale, rounded: $249 / $449 / $899 / $1,549.

### Out of scope

- Existing subscribers on old prices are NOT migrated — they keep their current rate (legacy price IDs remain mapped in `PRICE_TO_TIER`).
- No sale end-date logic — `LAUNCH_PRICING.active` flag flips it off later.
- Stripe coupons/promo codes (we use new prices directly so reporting stays clean).

### Verification

1. Visit `/auth` signup — each tier card shows strikethrough + sale + "Launch Pricing" chip.
2. Visit `/dashboard/subscription` — same treatment; comparison table updated.
3. Click "Upgrade" on a tier → Stripe Checkout shows new $ amount + onboarding line item.
4. Existing test sub on old price still resolves to correct tier via `check-subscription`.
5. Export a PDF (Pricing Summary, Sales Pitch) — new amounts with strikethrough render.
