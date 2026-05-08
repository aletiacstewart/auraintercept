---
name: 60-Day Live Trial Standard
description: All trials are 60 days. Onboarding fee is due at start of trial. Subscription progress bar = (60 - daysRemaining)/60. Reminders fire at 7d, 3d, 1d, and expiry.
type: feature
---
Trial length is 60 days for every new company signup. No credit card required to start, but the one-time onboarding fee is due at the start of the trial.

Implementation:
- src/pages/Auth.tsx expiration math: now + 60 * 24 * 60 * 60 * 1000
- src/pages/Subscription.tsx progress: ((60 - daysRemaining)/60) * 100
- supabase/functions/trial-reminders cadence: 7-day / 3-day / 1-day / expired email reminders

Onboarding fee (one-time, due at start of 60-Day Live Trial):
- Aura Core $497 · Aura Boost $697 · Aura Pro $1,197 · Aura Elite $2,197
- Source of truth: src/lib/documentationConfig.ts implementationFee
- Non-refundable once onboarding has been completed.

When updating trial copy anywhere, always say "60-Day Live Trial" — never 30-day or 90-day.
