# Wire Aura Intercept Stripe account into checkout

The Stripe secret key was just updated to the correct **Aura Intercept** account, and I created all 8 products/prices in that account. Now the edge functions need to point at the new price IDs so checkout actually works.

## New price IDs (just created)

| Tier | Subscription | Onboarding (one-time) |
|---|---|---|
| Core ($497/mo + $249) | `price_1TmJ2pEGn9AqCo3ECdv8mh0A` | `price_1TmJ2tEGn9AqCo3EmpVYjiUm` |
| Boost ($994/mo + $497) | `price_1TmJ2qEGn9AqCo3EpspZoDZK` | `price_1TmJ2uEGn9AqCo3EO854d1Ml` |
| Pro ($1,988/mo + $994) | `price_1TmJ2rEGn9AqCo3EkxrT5Z09` | `price_1TmJ2vEGn9AqCo3EHoqQuLSm` |
| Elite ($3,979/mo + $1,990) | `price_1TmJ2tEGn9AqCo3ES4Mf3YHm` | `price_1TmJ2wEGn9AqCo3E6oQRe5E7` |

## Changes

1. **`supabase/functions/create-checkout/index.ts`** — swap the 4 `price_id` and 4 `onboarding_price_id` values in CORE/BOOST/PRO/ELITE to the new IDs above.
2. **`supabase/functions/check-subscription/index.ts`** — prepend a new "Aura Intercept account" block to `PRICE_TO_TIER` mapping the 4 new subscription IDs to `starter / connect / performance / command`. Keep all existing legacy entries intact (sandbox account IDs become dead lookups, harmless).

## Manual step after this lands

In the new Aura Intercept Stripe account: **Settings → Billing → Customer portal → Activate** so the "Manage Subscription" button works. (Same one-click activation as before.)

Approve and I'll apply both edits and you can run a test checkout.
