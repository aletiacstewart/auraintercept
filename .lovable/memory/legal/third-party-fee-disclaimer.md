---
name: Third-party fee policy (bundled + pass-through split)
description: SignalWire/ElevenLabs/Resend/Tavily are BUNDLED up to plan limits with overage rates. A2P 10DLC and Stripe are CUSTOMER PASS-THROUGH (no Aura markup).
type: feature
---
Two distinct fee models govern third-party services:

BUNDLED (in subscription, with overage):
- Resend: 3,000 emails/mo bundled · overage $0.90 per 1,000 · 100/day default cap · monthly reset · $0.0015/run for >10,000 runs
- Tavily: 1,000 credits/mo bundled · overage $0.008/credit (Search/Extract/Map credits)
- SignalWire: bundled voice/SMS minutes per tier · overage invoiced
- ElevenLabs: bundled TTS allowance per tier · overage invoiced

CUSTOMER PASS-THROUGH (charged by carriers/processors directly, no Aura markup):
- A2P 10DLC: $4.50 brand registration (one-time) · variable campaign fees billed first 3 months upfront · $250/mo T-Mobile fee for inactive campaigns · 1–4 week approval timeline
- Stripe: 2.9% + $0.30 per transaction (volume discounts apply); customer connects own Stripe account

Standard copy:
- Bundled: "X bundled in your plan; overage <rate> invoiced at month-end"
- Pass-through: "Customer pass-through — billed by <carrier/processor> directly, no Aura markup"

Do NOT show generic "vendor pricing subject to change" disclaimers; show specific overage rates instead.
