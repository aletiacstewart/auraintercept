## Goal

Sweep every place where Aura Intercept describes pricing, trial, onboarding length, or third-party costs and bring it in line with the canonical source of truth (homepage + sign-up + memory). No copy may contradict these four rules:

1. **Pricing (Beta active)** — Core **$497/mo** (was $697), Boost **$994/mo** (was $1,394), Pro **$1,988/mo** (was $2,788), Elite **$3,979/mo** (was $5,576). Per-tier onboarding fee at 50% off during Beta (Core $249 / Boost $497 / Pro $994 / Elite $1,990). Always show original strikethrough + sale + "Beta Pricing" chip.
2. **Trial** — **60-Day Live Trial** = 30 days concierge onboarding + 30 days full live use. Onboarding fee is due at start. Never "90-day", never "no credit card required".
3. **Third-party fees** — SignalWire, ElevenLabs, Resend, Tavily, Stripe, A2P 10DLC, social: customer's **own account**, billed **directly by the provider**, **not bundled**, **no Aura markup**, **billed even during the trial**. Forbidden words: "bundled", "included minutes/texts/credits", "overage", "absorbed", "no carrier fees".
4. **Implementation** — **14–30 days** (concierge onboarding window). Never "under an hour", never "24–72 hours".

## What gets fixed

### 1. Aura Intercept FAQ table (database)

Update the `faqs` rows for company `04c57cbe-358e-4036-a3ad-b777a55f5be0` via migration. Every answer touching trial / pricing / third-party / onboarding gets rewritten. Confirmed offenders include:

- "Are there extra fees for SMS, voice, or email?" → rewrite to customer-pass-through wording.
- "Is there a free trial?" / "Is there a free trial available?" / "What happens when my 90-day trial ends?" → 60-Day Live Trial wording, onboarding fee due at start.
- "Do I need a SignalWire or ElevenLabs account?" → Yes, you bring your own (or Concierge sets it up with your card).
- "Do I need to pay for integrations separately?" → Yes — pass-through to each provider.
- "How long does onboarding take?" / "How long does implementation take?" → 14–30 days concierge.
- "How do I get started with Aura Intercept?" → new 5-step flow without "90-day" and without "bundled".
- "What subscription plan is right for my business?" / "What subscription plans are available?" / "What is included in the Boost tier specifically?" → new Beta prices with originals struck through, no $197/$497/$997/$1,997 anywhere.
- "Are there setup or implementation fees?" → Yes — one-time onboarding fee per tier (50% off during Beta), due at start of trial.
- "Are there annual billing discounts?" → keep ~20% language, refresh numbers from `launchPricing.ts`.
- "Can I white-label the platform?" / tier-specific answers → re-checked against current tier matrix.

Any other FAQ row whose answer mentions `90`, `bundle`, `$197`, `$997`, `$1,997`, `no credit card`, `under an hour`, `24–72 hours`, `carrier fees` is rewritten in the same migration.

### 2. Export Documentation PDFs (`src/components/documentation/*`)

Sweep and rewrite the same four topics in:

- `PlatformFAQPDF.tsx`
- `SalesPitchDataPDF.tsx`
- `PricingSummaryPDF.tsx`
- `ComprehensiveGuidesPDF.tsx`
- `MarketingSalesMasterPDF.tsx`
- `CompanyOnboardingPDF.tsx`
- `PlatformDocumentPDF.tsx`
- `WebsiteCopyPDF.tsx`
- `VideoScriptsPDF.tsx`
- `SocialMediaContentPackPDF.tsx`
- `AIAgentGuidesPDF.tsx`
- `BrandAssetGuidePDF.tsx`

Pricing references will be sourced from `src/lib/launchPricing.ts` (already canonical) instead of hard-coded numbers wherever practical; otherwise the numbers above are pasted in with the strike-through original.

### 3. Landing / sign-up / shared sales prompts

- `src/lib/auraInterceptSalesPrompt.ts`
- `supabase/functions/_shared/aura-intercept-sales-prompt.ts`
- `supabase/functions/ai-agent-chat/index.ts` (any inline KB blurbs)
- `src/pages/Index.tsx`, `src/pages/ForBusiness.tsx`, `src/pages/SignUp.tsx`, `src/pages/Subscription.tsx`, `src/pages/Help.tsx`, `src/pages/Contact.tsx`, `src/pages/PlatformGuides.tsx`, `src/pages/PublicOnboardingIntake.tsx`
- `src/components/landing/PricingComparisonTable.tsx`, `CompetitiveDifferentiation.tsx`
- `src/components/billing/BetaSignupNotice.tsx`, `BetaCodeInput.tsx`
- `src/components/dashboard/TrialBanner.tsx`
- `src/components/agents/TierComparisonCards.tsx`, `AgentRequirementCalculator.tsx`
- `src/components/marketing/IndustryROICalculator.tsx`
- `src/lib/diyCostBreakdown.ts`, `src/lib/subscriptionAgentConfig.ts`, `src/lib/industryMarketingContent.ts`, `src/lib/industryMarketingPlaybooks.ts`, `src/lib/helpSystemPrompt.ts`, `src/lib/auditFindings.ts`
- `supabase/functions/trial-reminders/index.ts`, `supabase/functions/check-subscription/index.ts`, `supabase/functions/create-checkout/index.ts`

Each file is grep-audited for the offending strings (`90-day`, `90 day`, `no credit card`, `bundle`, `bundled`, `$197`, `$997`, `$1,997`, `under an hour`, `24–72 hours`, `carrier fees`) and rewritten in place.

### 4. Knowledge Base uploads UI

`src/pages/KnowledgeBase.tsx` (and the FAQ editor) gets a small banner: "Aura Intercept canonical answers" with a one-click "Reset to canonical" action that re-applies the migration's answers to the 6 most-edited rows, so future drift can be undone without a developer.

### 5. Verification

- Re-run `rg` for each forbidden phrase across `src/`, `supabase/functions/`, and the `faqs` table — must return zero hits in user-facing copy.
- Spot-check: open `/dashboard/knowledge`, the 3 FAQs in the screenshots, and the Export Documentation page; confirm wording matches.

## Out of scope

- Re-pricing or restructuring tiers (numbers come from existing `launchPricing.ts` / memory — not changed here).
- Per-customer-company FAQs and KBs (only the Aura Intercept tenant `04c57cbe-…` is touched).
- ElevenLabs voice prompt content (already refreshed in the prior turn; will re-verify it has no offending phrases).

## Deliverable

One SQL migration (FAQ rewrites) + one round of source edits across the files above + verification grep report, all aligned to the 4 rules at the top.
