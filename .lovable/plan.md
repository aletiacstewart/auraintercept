# Trial Copy + FREE Cleanup + Beta/FCC Restructure

## 1. Trial period — ensure "90-Day Live Trial" everywhere

The codebase was already updated to 90 days, but user's screenshot shows "60-Day Live Trial" still appearing (likely a cached/published surface, but I'll re-sweep to be safe).

Verify and fix any remaining "60-day" / "60 day" trial references in:
- `src/pages/Index.tsx`, `src/pages/Auth.tsx`, `src/pages/Subscription.tsx`, `src/pages/TermsOfService.tsx`
- `src/components/dashboard/TrialBanner.tsx`, `src/components/landing/*`
- `supabase/functions/trial-reminders/index.ts`, `supabase/functions/check-subscription/index.ts`
- Doc PDF generators under `src/components/documentation/`

Leave unrelated "60 days" references alone (campaign lookbacks, OAuth token expiry, T-Mobile inactive-campaign rule, "success in 60 days" onboarding question, social token TTL, etc.).

## 2. Remove the word "FREE" from user-facing content

Replace marketing copy that uses "Free" / "FREE" with neutral wording. Mapping:

| Current | Replace with |
|---|---|
| `START YOUR FREE TRIAL →` (hero CTA, Index.tsx:858) | `START YOUR 90-DAY LIVE TRIAL →` |
| `Start Free Trial` (plan card CTAs, Index.tsx ×4) | `Start 90-Day Live Trial` |
| `Start Free Trial` (Auth.tsx submit button) | `Start 90-Day Live Trial` |
| `Free Trial` badge (Subscription.tsx:495) | `Live Trial` |
| `…remaining in your free trial` (Subscription.tsx:504) | `…remaining in your 90-day live trial` |
| `We offer a free audit…` (Index.tsx:918) | `We offer a complimentary audit…` |
| `Customer accounts are always free` (Auth.tsx ×2) | `Customer accounts are always complimentary` |
| `Free — unlimited, all tiers` (Google Calendar card) | `Included — unlimited, all tiers` |
| `Free OAuth — connect your existing pages` (Social card) | `OAuth — connect your existing pages` |
| `Your Google acct · free OAuth` (PricingComparisonTable + Auth) | `Your Google acct · OAuth` |
| `Free — no usage limits` (PricingComparisonTable Chat Widget) | `Included — no usage limits` |
| `Fees paid directly to Stripe — no free tier` (Stripe card) | `Fees paid directly to Stripe` |
| `…free-tier limits are set by each vendor…` (Auth.tsx:1022) | `…included limits are set by each vendor…` |

Leave technical/code identifiers untouched: `tier: 'free'`, `currentTier || 'free'`, `replace('_', '-') || 'Free'` label fallback (this is for users on no tier — change display fallback to `'None'`).

## 3. Restructure Beta box and FCC notice (`src/pages/Index.tsx` lines 1073–1103)

Currently the "We're in Beta!" panel contains a nested "SMS System — FCC 10DLC Compliance" sub-card. The 3rd-Party Integrations grid directly below already has its own `A2P 10DLC Compliance` card covering the same info.

- **Keep** the "We're in Beta!" panel above the plans/3rd-party section, but **remove the nested FCC 10DLC sub-card** so the beta panel only shows beta + 90-Day Live Trial messaging.
- **Keep / expand** the existing A2P 10DLC card inside the "3rd Party Integration Costs + Usage Fees" grid (already present at lines 1160–1169) — promote it to a full-width row above the grid with the longer compliance copy (EIN/DBA, approval timeline, pass-through fees) merged in from the removed sub-card, so no information is lost.

Same restructure mirrored on `src/pages/Auth.tsx` Beta Notice block (lines 845–855) if it has a similar nested FCC sub-card — verified it does not, so only Index.tsx needs the move.

## Out of scope

- Stripe price IDs, DB migrations, backend billing logic
- Touching unrelated "60 days" business-logic constants (campaign windows, token TTLs)
- Onboarding/marketing PDFs that don't surface "Free Trial" wording
