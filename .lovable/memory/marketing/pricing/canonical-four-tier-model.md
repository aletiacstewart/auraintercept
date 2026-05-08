---
name: Canonical 4-tier pricing model
description: Monthly subscription, onboarding fee, and tier IDs for Core/Boost/Pro/Elite. Onboarding fee is one-time, due at start of 60-Day Live Trial.
type: feature
---
Canonical 4-tier growth ladder:

| Tier | Monthly | Annual | Onboarding (one-time) | Internal ID |
|------|---------|--------|----------------------|-------------|
| Aura Core   | $197/mo   | $1,970/yr  | $497   | starter     |
| Aura Boost  | $497/mo   | $4,970/yr  | $697   | connect     |
| Aura Pro    | $997/mo   | $9,970/yr  | $1,197 | performance |
| Aura Elite  | $1,997/mo | $19,970/yr | $2,197 | command     |

Onboarding fee is due at the start of the 60-Day Live Trial and is non-refundable once onboarding has been completed.

Source of truth for the onboarding fee: src/lib/documentationConfig.ts (implementationFee field).
Pricing supports monthly/annual toggle with ~20% savings for annual billing.
