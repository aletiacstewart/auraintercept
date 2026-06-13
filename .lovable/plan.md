## Goal

Change beta onboarding from a flat **$497 for all tiers** to **50% of each tier's beta monthly price**:

| Tier  | Beta monthly | New onboarding (50%) |
|-------|--------------|----------------------|
| Core  | $497         | **$249**             |
| Boost | $994         | **$497**             |
| Pro   | $1,988       | **$994**             |
| Elite | $3,979       | **$1,990**           |

Onboarding "standard" (struck-through) values stay where they are today on each tier (no change to the strikethrough column).

## 1. Source-of-truth pricing

**`src/lib/launchPricing.ts`** — update each tier's `onboardingSale`:
- starter: 249
- connect: 497
- performance: 994
- command: 1990

Retire the flat $497 cap concept:
- Set `BETA_ONBOARDING_CAP_CENTS = 0`, `BETA_ONBOARDING_CAP_AMOUNT = 0`.
- Rewrite `isBetaCapActive()` to return `false` and `getBetaOnboardingPrice()` to just return `getOnboardingPrice(tier)`. Keep exports so nothing breaks.
- Update the file-header comment matrix.

## 2. Stripe + checkout

**Create four new one-time onboarding prices in Stripe** (one per tier), via `stripe--create_stripe_product_and_price`:
- Aura Core Onboarding — $249
- Aura Boost Onboarding — $497
- Aura Pro Onboarding — $994
- Aura Elite Onboarding — $1,990

**`supabase/functions/create-checkout/index.ts`**:
- Remove `FLAT_ONBOARDING_PRICE_ID`. Give each tier (`CORE`, `BOOST`, `PRO`, `ELITE`) its own `onboarding_price_id` from the new Stripe prices.
- Strip the beta-cap branch (lines ~221–257): since onboarding is now already tier-specific and lower than any previously-quoted cap, just push `{ price: selectedTier.onboarding_price_id, quantity: 1 }` (still honoring `betaWaiveOnboarding`).
- Update the header comment block to the new matrix.

**`src/components/billing/BetaCodeInput.tsx`** — drop the "capped at $X" string; replace with neutral copy ("Beta pricing applied — 60-day live trial").

## 3. Marketing copy — replace "flat $497 onboarding" everywhere

Update to per-tier values (Core $249 / Boost $497 / Pro $994 / Elite $1,990):

- `src/components/billing/BetaSignupNotice.tsx` — change the bullet list onboarding column to per-tier; rewrite the "capped at $497 regardless of tier" sentence to "onboarding is 50% of your beta monthly price (one-time)".
- `src/components/landing/PricingComparisonTable.tsx`
- `src/components/landing/CompetitiveDifferentiation.tsx`
- `src/components/agents/TierComparisonCards.tsx` (upgrade summary footer)
- `src/components/marketing/IndustryROICalculator.tsx`
- `src/pages/Index.tsx`, `src/pages/ForBusiness.tsx`, `src/pages/Subscription.tsx`, `src/pages/SignUp.tsx`, `src/pages/PublicOnboardingIntake.tsx`, `src/pages/Contact.tsx`, `src/pages/Help.tsx`, `src/pages/PlatformGuides.tsx`, `src/pages/TermsOfService.tsx`, `src/pages/ExportDocumentation.tsx`
- AI/system-prompt copy: `src/lib/helpSystemPrompt.ts`, `supabase/functions/ai-agent-chat/index.ts`, `supabase/functions/landing-chat/index.ts`, `supabase/functions/trial-reminders/index.ts`

Wherever possible, replace hard-coded "$497" onboarding strings with `getOnboardingPrice(tier)` / `getTierPricing(tier).onboardingSale` so future changes are one-file.

## 4. Exported PDFs / documents

Regenerate the onboarding-fee references in:
- `src/components/documentation/PricingSummaryPDF.tsx`
- `src/components/documentation/PlatformFAQPDF.tsx`
- `src/components/documentation/PlatformDocumentPDF.tsx`
- `src/components/documentation/CompanyOnboardingPDF.tsx`
- `src/components/documentation/ComprehensiveGuidesPDF.tsx`
- `src/components/documentation/MarketingSalesMasterPDF.tsx`
- `src/components/documentation/SalesPitchDataPDF.tsx`
- `src/components/documentation/AIAgentGuidesPDF.tsx`
- `src/components/documentation/WebsiteCopyPDF.tsx`
- `src/components/documentation/SocialMediaContentPackPDF.tsx`
- `src/components/documentation/VideoScriptsPDF.tsx`
- `src/components/documentation/BrandAssetGuidePDF.tsx`

Each gets a per-tier onboarding table replacing the "flat $497 onboarding" / "$497 capped" language.

## 5. Memory updates

- `mem://index.md` Core block: rewrite the launch-pricing line to "Onboarding = 50% of beta monthly: Core $249 / Boost $497 / Pro $994 / Elite $1,990 (originals struck through unchanged)."
- `mem://billing/launch-pricing` — same per-tier onboarding values; remove the flat-$497 cap note; add the four new Stripe onboarding price IDs created in Step 2.
- `mem://product/trial-period-standard` — update "onboarding fee due at start" examples.
- `mem://legal/third-party-fee-disclaimer` — no change (third-party policy unaffected).

## 6. Out of scope

- Monthly tier prices, annual prices, struck-through originals — unchanged.
- Trial length / trial mechanics — unchanged (still 60-day).
- Subscription tiers, agent counts, feature gating — unchanged.
- Existing subscribers on the prior $497 onboarding line item — already paid; no retro changes.

## Technical notes

- Need 4 new Stripe onboarding price IDs before swapping in `create-checkout/index.ts`. Old `price_1ThWTnJ9fo9y8fGHWnT31XSF` stays defined-but-unused for any historic invoice references.
- After the migration of strings, run `rg "\$497.*onboard|flat \$497|capped at \$497"` to confirm no stragglers remain.
- No DB schema changes; `beta_codes.onboarding_fee_cap_cents` column stays but the cap branch is dead code — leaving the column intact preserves historical row data.
