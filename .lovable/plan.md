## Batch: 3 audits + Onboarding fee → 25% off (was 50%)

### Part A — Onboarding fee: 50% OFF → 25% OFF

**New numbers (25% off original, rounded to nearest $10):**

| Tier  | Original | Old sale (50% off) | New sale (25% off) |
|-------|----------|--------------------|--------------------|
| Core  | $497     | $249               | **$370**           |
| Boost | $994     | $497               | **$750**           |
| Pro   | $1,988   | $994               | **$1,490**         |
| Elite | $3,979   | $1,990             | **$2,980**         |

**1. Single source of truth — `src/lib/launchPricing.ts`**
Update `onboardingSale` values (249→370, 497→750, 994→1490, 1990→2980) and rewrite the docblock (lines 12–19) from "50% OFF" to "25% OFF" with the new table.

**2. Hardcoded strings across the platform**
Grep-driven sweep, replacing both the dollar amounts AND every "50% OFF" / "50% of beta monthly" phrase:

- `src/pages/Index.tsx` (lines 635, 667, 699, 729) — 4 pricing cards
- `src/pages/Help.tsx` — onboarding lines in the pricing section
- `src/pages/TermsOfService.tsx` (line 65) — legal onboarding fee disclosure
- `src/components/audit/types.ts` (lines 268, 285, 302, 319) — `implementationFee` on all 4 tiers
- `src/components/audit/AuditResults.tsx` (line 517) — trial disclosure sentence
- `supabase/functions/_shared/aura-intercept-sales-prompt.ts` (lines 24–33) — voice sales prompt
- `supabase/functions/ai-agent-chat/index.ts` (lines 3393, 3400, 3408, 3417) — tier tool comments (already reference the values in copy)
- `supabase/functions/create-checkout/index.ts` (lines 15–41) — update comments; leave `onboarding_price_id` placeholders with a `TODO: replace with new 25%-off price IDs` marker (user will paste)
- Any PDF/doc component under `src/components/documentation/*` that mentions onboarding dollars (PricingSummaryPDF, PlatformFAQPDF, CompanyOnboardingPDF, SalesPitchDataPDF, ComprehensiveGuidesPDF, MarketingSalesMasterPDF, IntegrationOnboardingPDF, PlatformDocumentPDF, CompanyGuidesPDF, WebsiteCopyPDF) — replace hardcoded 249/497/994/1990 in onboarding context and 50% wording

**3. Copy phrase migration**
Every occurrence of "50% OFF — Beta" / "50% off during Beta" / "50% of beta monthly" becomes "25% OFF — Beta" / "25% off during Beta" / "75% of original onboarding".

**4. Memory update (`mem://index.md` Core rule)**
Change: "Onboarding = 50% of beta monthly per tier" → "Onboarding = 25% OFF original (Core $370, Boost $750, Pro $1,490, Elite $2,980); originals struck through unchanged".

**5. Stripe (blocked on user)**
Leave `onboarding_price_id` values in `create-checkout/index.ts` untouched but add a clear `// TODO(pricing-update): replace with new 25%-off price IDs — user is creating in Stripe` comment above each. Ship copy/UX now; wire IDs in a follow-up once user pastes them.

---

### Part B — #1 Security scan

Run `security--run_security_scan` and address anything actionable (RLS/GRANT drift, especially on recent tables touched by the trial/pricing/onboarding work). Update `security--update_memory` with any findings intentionally ignored.

### Part C — #3 SEO sweep on public pages

Add per-page `<title>`, `<meta description>`, and `<link rel="canonical">` via a lightweight `<SEO>` component (react-helmet-async pattern already present via `HelmetProvider`, or a tiny `useEffect` head mutator if not — will check first). Apply to:

- `src/pages/Index.tsx` — home
- `src/pages/ForBusiness.tsx`
- `src/pages/OpportunityAudit.tsx` / `AuditReport.tsx`
- `src/pages/Blog.tsx` + `src/pages/BlogPost.tsx` (dynamic per-post)
- `src/pages/Contact.tsx`
- `src/pages/TermsOfService.tsx`, `PrivacyPolicy.tsx` (if present)
- `src/pages/SignUp.tsx`, `src/pages/Auth.tsx`

Each: unique title (<60 chars), description (<160 chars), canonical to `https://auraintercept.ai<path>`. Ensure single `<h1>` per page.

### Part D — #5 404 hygiene

- `src/pages/NotFound.tsx`: add `<meta name="robots" content="noindex, nofollow">` via the same SEO helper, and log the bad path to `platform_issues` (issue_type `not_found`, low severity) so we can see where broken inbound links point.

---

### Verification

- `bun run build` clean
- `tsgo --noEmit` clean
- Playwright screenshot of `/` pricing cards + `/audit` implementation fee + `/terms-of-service` onboarding line — confirm all show new $370/$750/$1,490/$2,980 with "25% OFF — Beta"
- Grep confirms zero remaining `50% OFF` / `50% of beta monthly` / old onboarding-fee amounts in an onboarding context
- Security scan re-run shows no new criticals

### Not doing (deferred)

- Stripe price ID wiring in `create-checkout` (waiting on user)
- Alt-text sweep on marketing images, bundle-size/lazy-route pass, mobile viewport pass — separate future batches
