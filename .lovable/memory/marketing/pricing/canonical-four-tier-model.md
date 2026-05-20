---
name: Canonical 4-tier pricing model
description: Monthly subscription, onboarding fee, and tier IDs for Core/Boost/Pro/Elite. Onboarding fee is one-time, due at start of 90-Day Live Trial (first 30 days = onboarding window).
type: feature
---
Canonical 4-tier growth ladder (monthly price now equals one-time onboarding fee):

| Tier | Monthly | Annual | Onboarding (one-time) | Internal ID |
|------|---------|--------|----------------------|-------------|
| Aura Core   | $497/mo   | $4,970/yr   | $497   | starter     |
| Aura Boost  | $697/mo   | $6,970/yr   | $697   | connect     |
| Aura Pro    | $1,197/mo | $11,970/yr  | $1,197 | performance |
| Aura Elite  | $2,197/mo | $21,970/yr  | $2,197 | command     |

Onboarding fee is due at the start of the 90-Day Live Trial and is non-refundable once onboarding has been completed. The first 30 days of the trial are dedicated to onboarding; the remaining 60 days are full live use.

Source of truth for the onboarding fee: src/lib/documentationConfig.ts (implementationFee field).
Pricing supports monthly/annual toggle with ~20% savings for annual billing.
