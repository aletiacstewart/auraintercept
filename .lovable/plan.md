## Goal

Two global changes across the platform:

1. **Monthly plan prices** now equal the current onboarding fees:
   - Core: $197/mo → **$497/mo**
   - Boost: $497/mo → **$697/mo**
   - Pro: $997/mo → **$1,197/mo**
   - Elite: $1,997/mo → **$2,197/mo**
   - Onboarding fees themselves stay as-is ($497 / $697 / $1,197 / $2,197).
2. **Trial length**: 60-Day Live Trial → **90-Day Live Trial** (everywhere — copy, math, reminders, progress bar denominator).

## Scope

Frontend / presentation only. No Stripe price ID changes, no DB migrations, no edge function billing logic changes in this pass.

### Files to sweep (price strings + trial day count)

- Pricing surfaces: `src/pages/Index.tsx`, `src/pages/Auth.tsx`, `src/pages/Subscription.tsx`, `src/components/landing/PricingComparisonTable.tsx`, any plan card / tier card components.
- Calculators / outreach: `src/pages/Calculators.tsx`, ROI components, outreach PDF generators if they list prices.
- Documentation PDFs: `src/components/documentation/*PDF.tsx` (CompanyOnboarding, PlatformDocument, Comprehensive, CompanyGuides, AIAgentGuides, PlatformFAQ).
- Tier constants / maps: `src/lib/` tier definitions, `LEGACY_TIER_MAP`, `demoFeatureStatus.ts`, `documentationConfig.ts`.
- Trial logic: progress bar `(60 - daysRemaining)/60` → `(90 - daysRemaining)/90`; trial reminder copy; "60-Day Live Trial" label everywhere.
- Memory: update `mem://index.md` Core rule and `mem://product/trial-period-standard`.

### Approach

1. `rg` for `\$197|\$497|\$697|\$997|\$1,197|\$1,997|\$2,197` and `60.?[dD]ay|60 days|sixty.day` to enumerate every hit.
2. Apply price + trial replacements file by file.
3. Update `LEGACY_TIER_MAP` / tier constant objects so any tier lookup returns the new monthly value.
4. Update trial math constants and progress denominator.
5. Update memory Core lines.
6. Final `rg` sweep to confirm no stragglers.

### Out of scope

- Stripe product/price IDs and backend subscription records (call out to user separately if they want those updated via Stripe tools).
- Changing onboarding fee amounts.
- Refactoring tier structure or feature gates.
