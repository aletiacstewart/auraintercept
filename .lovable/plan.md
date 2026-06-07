## Goal
Add a clear BETA sign-up notice explaining pricing and fees during the beta period in two locations:
1. **Homepage (`/`)** — above the pricing plans section, replacing the existing "We're in Beta!" block
2. **Sign-up form (`/auth?mode=company&tab=signup`)** — near the tier selector, replacing any existing beta copy there

## Proposed Beta Copy (to be used in both locations)

```text
BETA Sign-Up — Limited Time

All beta members receive a 60-Day Live Trial (30 days concierge onboarding + 30 days full live use). 

During beta, your one-time onboarding fee is capped at $497 regardless of tier, and you get Launch Pricing on your monthly plan:
• Core: ~~$697~~ $497/mo  |  Onboarding: ~~$349~~ $249
• Boost: ~~$1,097~~ $897/mo  |  Onboarding: ~~$549~~ $449
• Pro: ~~$1,797~~ $1,797/mo  |  Onboarding: ~~$999~~ $899
• Elite: ~~$3,997~~ $2,997/mo  |  Onboarding: ~~$1,749~~ $1,549

Your 3rd-party providers (SignalWire, ElevenLabs, Resend, Tavily, Stripe) require your own account with a valid credit card and bill you directly — separate from your Aura plan fee.

The onboarding fee is due at the start of your trial and covers account configuration, AI agent setup, knowledge-base build-out, 3rd-party activation, A2P 10DLC compliance filing, and your initial training session.
```

## Changes

### `src/pages/Index.tsx`
- Remove the existing "We're in Beta!" block (lines ~1089–1114) inside the pricing section.
- Insert the new beta notice as a full-width card/banner **above** the 4 plan cards in the `#pricing` section.
- Style with the existing themed borders (primary/accent tones) to match the dark gradient background.

### `src/pages/Auth.tsx`
- Find the company-signup tier selector area (where `selectedTier` state and plan cards are rendered).
- Remove or replace any existing beta mention in that area.
- Insert the new beta notice as a compact card/banner **just above** the tier selection cards.
- Use the same themed styling (border-primary/30, bg-primary/5, etc.) for consistency.

## Out of scope
- No changes to pricing logic, Stripe integration, or beta-code redemption.
- No changes to `launchPricing.ts` constants.
- No database or backend changes.
- No changes to the `/dashboard/subscription` checkout page or existing onboarding flow emails.