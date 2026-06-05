## Update Elite tier pricing: $3,997 → $2,997

**Change:** Elite monthly goes from `$3,497 → $3,097 sale` to `$3,997 (strikethrough) → $2,997 sale`. Onboarding stays at `$1,749 / $1,549` per your call. All other tiers unchanged.

### 1. Stripe (new monthly price, keep onboarding)
- Create new Stripe price `$2,997/mo` recurring on existing Aura Elite product.
- Wire into `supabase/functions/create-checkout/index.ts` as `ELITE.price_id`; keep onboarding `price_id` (Tee...kJ) untouched.
- Add the prior Elite monthly `price_1TeergJ9fo9y8fGHMwqU7pMV` (and original `Tdvk*` Elite IDs) to the legacy/grandfather map in `check-subscription` so existing $3,097 subs still resolve to `command` tier.

### 2. Source of truth
- `src/lib/launchPricing.ts` → `command`: `original: 3997`, `sale: 2997` (onboarding fields unchanged).
- `supabase/functions/create-checkout/index.ts` → `ELITE.price = 299700`, new `price_id`, update header comment block.

### 3. Sweep hardcoded references
Grep + replace `$3,497`, `3497`, `$3,097`, `3097` (Elite-context only — Core/Boost/Pro untouched):
- `src/components/documentation/*.tsx` (PricingSummaryPDF, MarketingSalesMasterPDF, SalesPitchDataPDF, PlatformDocumentPDF, PlatformFAQPDF, CompanyOnboardingPDF, WebsiteCopyPDF, VideoScriptsPDF, SocialMediaContentPackPDF)
- `src/components/landing/PricingComparisonTable.tsx`
- `src/pages/Subscription.tsx`, `src/pages/Index.tsx`, `src/pages/About.tsx`, `src/pages/ForBusiness.tsx`, `src/pages/Contact.tsx`, `src/pages/Help.tsx`, `src/pages/Auth.tsx`, `src/pages/TermsOfService.tsx`, `src/pages/PublicOnboardingIntake.tsx`
- `src/components/onboarding/FastStartWizard.tsx`, `src/components/subscription/ThirdPartyCostDisclosureDialog.tsx`
- `src/locales/{en,es}/{common,marketing,auth}.json`
- `public/llms.txt`
- `supabase/functions/submit-onboarding/index.ts`, `supabase/functions/trial-reminders/index.ts`

(Most live displays already pull from `launchPricing.ts` via `<SalePrice tier="command" />`, so this sweep targets only the residual hardcoded strings/comments.)

### 4. Memory
- `.lovable/memory/index.md` Core line → Elite `$2,997 (was $3,997) / $1,549 onboarding`.
- `.lovable/memory/billing/launch-pricing.md` → update Elite row + add note on legacy Elite price ID grandfather.
- `.lovable/memory/marketing/pricing/canonical-four-tier-model.md` → reflect new Elite numbers.
- `.lovable/memory/architecture/canonical-naming-registry.md` → Elite price.

### 5. Verification
- Grep confirms no remaining `3,497` / `3097` outside legacy-mapping comments.
- Subscription page renders Elite strike `$3,997` + sale `$2,997` + Launch Pricing chip.
- `create-checkout` returns new price ID for `tier: "command"`; existing $3,097 subs still tier-resolve via `check-subscription`.
- Build passes.

### Out of scope
- Other tiers (Core/Boost/Pro) — unchanged.
- Elite onboarding fee — unchanged per your decision.
- Annual price computation — derived from monthly, auto-updates.
