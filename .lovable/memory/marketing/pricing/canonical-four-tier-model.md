---
name: Canonical 4-tier pricing model
description: Monthly subscription (Standard + Beta) and tier IDs for Core/Boost/Pro/Elite. Onboarding fee is 25% OFF original one-month price, invoiced on day 31; first monthly fee charged on day 61.
type: feature
---
**Billing schedule:** The one-time onboarding fee is invoiced on day 31 of the 60-Day Live Trial (after concierge onboarding is complete). The first monthly plan fee is charged on day 61 (after the full 60-Day Live Trial). `ONBOARDING_FEE_WAIVED_GLOBALLY = false` in `src/lib/launchPricing.ts` and `supabase/functions/create-checkout/index.ts` so the deferred charge can be recorded and collected by the `charge-onboarding-fee` cron edge function. Beta invite codes can still waive the onboarding fee via `waive_onboarding_fee`.

Canonical 4-tier growth ladder (Beta Pricing active — onboarding = 25% OFF original one-month price, rounded to nearest $10):

| Tier        | Standard (struck) | Beta (billed) | Annual Beta | Onboarding Original (struck = 1 mo) | Onboarding Beta (25% OFF) | Internal ID |
|-------------|-------------------|---------------|-------------|--------------------------------------|---------------------------|-------------|
| Aura Core   | $697/mo           | $497/mo       | $4,771/yr   | $497                                 | $370                      | starter     |
| Aura Boost  | $1,394/mo         | $994/mo       | $9,542/yr   | $994                                 | $750                      | connect     |
| Aura Pro    | $2,788/mo         | $1,988/mo     | $19,085/yr  | $1,988                               | $1,490                    | performance |
| Aura Elite  | $5,576/mo         | $3,979/mo     | $38,198/yr  | $3,979                               | $2,980                    | command     |

Annual = round(monthly × 12 × 0.8) (~20% savings). Onboarding fee is non-refundable once onboarding is completed. The first 30 days of the trial are dedicated to onboarding; the remaining 30 days are full live use.

Source of truth for the onboarding fee: `src/lib/launchPricing.ts` (`onboardingSale` field).
Pricing source of truth: `src/lib/launchPricing.ts`.

Stripe price IDs (current):
- Beta monthly: Core `price_1TmJ2pEGn9AqCo3ECdv8mh0A`, Boost `price_1TmJ2qEGn9AqCo3EpspZoDZK`, Pro `price_1TmJ2rEGn9AqCo3EkxrT5Z09`, Elite `price_1TmJ2tEGn9AqCo3ES4Mf3YHm`
- Per-tier onboarding (Beta, 25% OFF): Core `price_1TqgFCEGn9AqCo3EFVk0SKZV` ($370), Boost `price_1TqgFDEGn9AqCo3Emyd1SEf5` ($750), Pro `price_1TqgFFEGn9AqCo3Ez36DpcJL` ($1,490), Elite `price_1TqgFFEGn9AqCo3Ei7axEGKc` ($2,980)
