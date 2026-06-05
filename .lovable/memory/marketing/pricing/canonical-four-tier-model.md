---
name: Canonical 4-tier pricing model
description: Monthly subscription, onboarding fee (= 50% of monthly), and tier IDs for Core/Boost/Pro/Elite. Onboarding fee is one-time, due at start of 90-Day Live Trial (first 30 days = onboarding window).
type: feature
---
Canonical 4-tier growth ladder (onboarding fee = 50% of monthly price, rounded to nearest dollar):

| Tier | Monthly | Annual | Onboarding (one-time) | Internal ID |
|------|---------|--------|----------------------|-------------|
| Aura Core   | $697/mo   | $6,970/yr   | $349   | starter     |
| Aura Boost  | $1,097/mo | $10,970/yr  | $549   | connect     |
| Aura Pro    | $1,997/mo | $19,970/yr  | $999   | performance |
| Aura Elite  | $3,997/mo (sale $2,997) | $29,970/yr  | $1,549 (sale) | command     |

Onboarding fee is due at the start of the 90-Day Live Trial and is non-refundable once onboarding has been completed. The first 30 days of the trial are dedicated to onboarding; the remaining 60 days are full live use.

Source of truth for the onboarding fee: src/lib/documentationConfig.ts (implementationFee field).
Pricing supports monthly/annual toggle with ~20% savings for annual billing.
