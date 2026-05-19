---
name: 90-Day Live Trial Standard
description: All trials are 90 days. First 30 days = onboarding window, remaining 60 days = full live use. Onboarding fee is due at start of trial. Subscription progress bar = (90 - daysRemaining)/90. Reminders fire at 7d, 3d, 1d, and expiry.
type: feature
---
Trial length is 90 days for every new company signup. No credit card required to start, but the one-time onboarding fee is due at the start of the trial.

**First 30 days of the 90-Day Live Trial are dedicated to onboarding** — account configuration, AI agent setup, knowledge-base build-out, 3rd-party activation (SignalWire, ElevenLabs, Resend), A2P 10DLC filing, and training. The remaining 60 days are spent fully live. Always include this clarifier in user-facing trial copy.

Implementation:
- src/pages/Auth.tsx expiration math: now + 90 * 24 * 60 * 60 * 1000
- src/pages/Subscription.tsx progress: ((90 - daysRemaining)/90) * 100
- supabase/functions/trial-reminders cadence: 7-day / 3-day / 1-day / expired email reminders

Onboarding fee (one-time, due at start of 90-Day Live Trial):
- Aura Core $497 · Aura Boost $697 · Aura Pro $1,197 · Aura Elite $2,197
- Source of truth: src/lib/documentationConfig.ts implementationFee
- Non-refundable once onboarding has been completed.

When updating trial copy anywhere, always say "90-Day Live Trial" and pair it with the onboarding clarifier:
- Short form (buttons/badges): `(first 30 days = onboarding)`
- Long form (paragraphs/FAQs/PDFs): `The first 30 days of your 90-Day Live Trial are dedicated to onboarding — account configuration, AI agent setup, knowledge-base build-out, 3rd-party activation, and training — so the remaining 60 days are spent fully live.`
