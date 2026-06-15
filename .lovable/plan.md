## Onboarding Fee Restructure + 3rd-Party Trial Disclosure Update

### 1. New Onboarding Pricing Model
Onboarding fee = **1 month of plan price (struck through) → 50% off shown as sale**.

| Tier  | Monthly (Beta) | Onboarding Original (struck) | Onboarding Sale (billed) |
|-------|---------------|------------------------------|--------------------------|
| Core  | $497          | ~~$497~~                     | **$249**                 |
| Boost | $994          | ~~$994~~                     | **$497**                 |
| Pro   | $1,988        | ~~$1,988~~                   | **$994**                 |
| Elite | $3,979        | ~~$3,979~~                   | **$1,990**               |

Sale prices remain unchanged (already 50% of beta monthly). Only the **struck-through "original"** changes from a flat $497 to match each tier's monthly. This makes the discount story consistent: "1st month onboarding fee, 50% off during beta."

### 2. Files to Update
**Source of truth (single edit cascades):**
- `src/lib/launchPricing.ts` — set `onboardingOriginal` per tier (497/994/1988/3979).

**Display surfaces verifying the new struck price:**
- `src/components/subscription/ThirdPartyCostDisclosureDialog.tsx`
- `src/components/billing/BetaSignupNotice.tsx`, `BetaCodeInput.tsx`
- `src/components/landing/PricingComparisonTable.tsx`
- `src/pages/Index.tsx`, `SignUp.tsx`, `Subscription.tsx`, `TermsOfService.tsx`
- `src/components/documentation/*PDF.tsx` (CompanyOnboarding, MarketingSalesMaster, PlatformDocument, PlatformFAQ, PricingSummary, WebsiteCopy)
- `src/lib/helpSystemPrompt.ts`, `src/lib/subscriptionAgentConfig.ts`
- `supabase/functions/ai-agent-chat/index.ts`, `landing-chat/index.ts`, `create-checkout/index.ts`
- `.lovable/plan.md` and memory: `marketing/pricing/canonical-four-tier-model.md`

**Stripe:** Onboarding price IDs already exist per tier (legacy + beta). Audit `create-checkout` to ensure the correct **per-tier** onboarding price is charged (not the flat $497 ID). If a per-tier Stripe price doesn't exist for an onboarding amount, create it via Stripe tools.

### 3. 3rd-Party Fee Disclosure — Rewrite (Trial Clarity)
Update copy everywhere it appears to make clear that **3rd-party usage fees are billed during the trial, per actual usage, by each vendor**.

**New canonical paragraph:**
> **3rd-party services are billed separately by each vendor — including during your 60-Day Live Trial.** Voice & SMS (SignalWire), AI voice (ElevenLabs), email (Resend), web research (Tavily), payments (Stripe), A2P 10DLC, and social APIs each require your own account with a valid credit card on file. You'll be invoiced **directly by each provider on a pay-as-you-go basis** for actual usage (per call, per text, per email, per voice minute, per search, per transaction). Aura's plan fee covers the platform only — we never resell, mark up, or absorb vendor charges, and these usage fees apply during your trial period.

**Short variant** (forms, footers, chips):
> 3rd-party usage (SignalWire, ElevenLabs, Resend, Tavily, Stripe, A2P 10DLC, social) is pay-as-you-go, billed directly by each vendor — including during your trial.

Files: `src/components/billing/ThirdPartyFeeNotice.tsx`, `ThirdPartyCostDisclosureDialog.tsx`, signup page, Subscription page, ToS, all PDFs above, FAQ PDF, landing-chat & ai-agent-chat system prompts, memory `legal/third-party-fee-disclaimer.md`.

### 4. Out of Scope
- No changes to monthly plan prices, annual prices, or tier features.
- No new Stripe products (only new prices if needed for tier-specific onboarding sale amounts that don't already exist).
- 60-Day Live Trial mechanics unchanged.

### Verification
- `bun run build` clean.
- Spot-check Index, SignUp, Subscription pages render new struck onboarding values.
- Generate one PDF (PricingSummary) and confirm new copy.
- Grep for "$497 flat" / "flat $497" / "flat fee" onboarding mentions and clean any stragglers.
