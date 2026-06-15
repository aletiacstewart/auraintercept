---
name: Canonical 4-tier pricing model
description: Monthly subscription (Standard + Beta) and tier IDs for Core/Boost/Pro/Elite. Onboarding fee = 1 month of plan (struck through) with 50% OFF during Beta, one-time, due at start of 60-Day Live Trial (first 30 days = onboarding window).
type: feature
---
Canonical 4-tier growth ladder (Beta Pricing active — onboarding = 1 month of plan, 50% OFF during Beta):

| Tier        | Standard (struck) | Beta (billed) | Annual Beta | Onboarding Original (struck = 1 mo) | Onboarding Beta (50% OFF) | Internal ID |
|-------------|-------------------|---------------|-------------|--------------------------------------|---------------------------|-------------|
| Aura Core   | $697/mo           | $497/mo       | $4,771/yr   | $497                                 | $249                      | starter     |
| Aura Boost  | $1,394/mo         | $994/mo       | $9,542/yr   | $994                                 | $497                      | connect     |
| Aura Pro    | $2,788/mo         | $1,988/mo     | $19,085/yr  | $1,988                               | $994                      | performance |
| Aura Elite  | $5,576/mo         | $3,979/mo     | $38,198/yr  | $3,979                               | $1,990                    | command     |

Annual = round(monthly × 12 × 0.8) (~20% savings). Onboarding fee is due at the start of the 60-Day Live Trial and is non-refundable once onboarding has been completed. The first 30 days of the trial are dedicated to onboarding; the remaining 30 days are full live use.

Source of truth for the onboarding fee: src/lib/documentationConfig.ts (implementationFee field).
Pricing source of truth: src/lib/launchPricing.ts.

Stripe price IDs (June 2026):
- Beta monthly: Core `price_1ThWTeJ9fo9y8fGHfDU4ZNq8`, Boost `price_1ThWTfJ9fo9y8fGHsbLQp0Za`, Pro `price_1ThWTgJ9fo9y8fGHgoZLc8qu`, Elite `price_1ThWThJ9fo9y8fGHGSowuwkR`
- Standard monthly (display/post-beta): Core `price_1ThWTjJ9fo9y8fGHWUZDqJa9`, Boost `price_1ThWTkJ9fo9y8fGH0rcvK8xa`, Pro `price_1ThWTkJ9fo9y8fGHRXECyHlO`, Elite `price_1ThWTmJ9fo9y8fGHinbLnhRH`
- Per-tier onboarding (Beta, 50% OFF): Core `price_1ThwUIJ9fo9y8fGHjmUhJtDw` ($249), Boost `price_1ThwUJJ9fo9y8fGHvVRIyQCb` ($497), Pro `price_1ThwUKJ9fo9y8fGHc8oQuO7u` ($994), Elite `price_1ThwULJ9fo9y8fGHYwbM6gWn` ($1,990)
