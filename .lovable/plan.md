# Review of Claude Prompts A–D + Recommended Updates

All four prompts are sound. Below is confirmation of what I verified in the codebase, plus small corrections/additions where the prompt missed a location or made an assumption that doesn't match current code.

---

## Prompt A — Standardize "non-refundable" language ✅ Confirmed, with additions

Prompt is correct. Repo search turned up **more locations** than the prompt lists. Full authoritative list to update:

- `src/pages/TermsOfService.tsx` — two hits (line 71 "…once onboarding is completed"; line 100 "Non-refundable once onboarding has been completed")
- `src/pages/PublicOnboardingIntake.tsx` — line 507 checkbox label
- `src/pages/SignUp.tsx` — line 1559 ("Non-refundable once onboarding begins")
- `src/components/documentation/PlatformFAQPDF.tsx` — lines 456 & 471
- `src/components/documentation/CompanyOnboardingPDF.tsx` — lines 1430, 1461, 1473
- `src/components/documentation/PricingSummaryPDF.tsx` — line 241 ("Non-refundable once onboarding begins") — **not in the prompt**
- `src/components/billing/BetaSignupNotice.tsx` — line 58 — **not in the prompt**
- `src/lib/auraInterceptSalesPrompt.ts` — line 43
- `supabase/functions/_shared/aura-intercept-sales-prompt.ts` — line 38

Replace all conditional variants with plain "non-refundable." Final grep for `non-refundable once`, `onboarding begins`, `onboarding is completed`, `onboarding has been completed` must return zero hits in `src/` and `supabase/`.

---

## Prompt B — Day-30 → day-31 timing ✅ Confirmed

Verified: `supabase/functions/create-checkout/index.ts` line 341 uses `30 * 24 * 60 * 60 * 1000`. `supabase/functions/_shared/trial.ts` already exports `TRIAL_ONBOARDING_DAYS = 30`, but "day 31" means **30 full onboarding days elapsed, invoice on the next day** — so the correct expression is `(TRIAL_ONBOARDING_DAYS + 1) * 24 * 60 * 60 * 1000`.

Recommendation: import `TRIAL_ONBOARDING_DAYS` from `_shared/trial.ts` and compute due-at as `TRIAL_ONBOARDING_DAYS + 1` days out. Don't hardcode `31` — keeps one source of truth. No new constant needed.

---

## Prompt C — Referral coupon stacking ✅ Confirmed, with one correction

Prompt's diagnosis is right: `subscriptions.update({ coupon })` replaces any unconsumed coupon. Balance credit is the correct fix.

**Correction:** the prompt's `createBalanceTransaction` call signature is wrong for the Stripe Node SDK. Correct form:

```ts
await stripe.customers.createBalanceTransaction(refCompany.stripe_customer_id, {
  amount: -referringCompanyMonthlyCents,
  currency: "usd",
  description: `Aura Referral reward — 1 month free (referral ${referralRow.id})`,
});
```

That matches what the prompt wrote, but note `unit_amount` on `activeSub.items.data[0].price` may be `null` for tiered/metered prices — add a fallback (skip credit + log a warning) if it's null instead of crediting `NaN`. Keep the existing `logStep` calls and the row-marking logic unchanged. Add the "why balance credits over coupons" comment as requested.

---

## Prompt D — Auto-waive onboarding fee, repurpose beta codes for trial extension ✅ Confirmed, with clarifications

Verified current state in `create-checkout/index.ts`:
- Line 65: `ONBOARDING_FEE_WAIVED_GLOBALLY = false` — flip to `true`
- Line 271: `onboardingWaivedReason` type is `"not_first_checkout" | "beta" | "none"` — extend to include `"global_beta"`; priority order should be: `not_first_checkout` > `referral` (if referral waiver path exists) > explicit `beta` code > `global_beta` fallback
- Line 320: `trial_period_days: 60` is **hardcoded** — the prompt's suspicion is correct; beta code's `trial_days` is not applied. Fix: `trial_period_days: appliedBetaCode?.trial_days ?? 60`
- Copy updates in `ForBusiness.tsx`, `PublicOnboardingIntake.tsx`, `PricingComparisonTable.tsx`: change struck-through onboarding pricing → "Onboarding fee: $0 during Beta"
- `BetaCodeInput.tsx` `onboardingLine` variable → reframe as trial-length messaging, e.g. `${applied.trial_days}-day Live Trial (extended from 60)`

**Additional locations** the prompt missed that reference onboarding pricing and should also switch to "$0 during Beta" for consistency:
- `src/pages/SignUp.tsx` beta notice block
- `src/components/billing/BetaSignupNotice.tsx`
- Sales/pricing PDFs (`PricingSummaryPDF.tsx`, `PlatformFAQPDF.tsx`, `CompanyOnboardingPDF.tsx`, `SalesPitchDataPDF.tsx`, `MarketingSalesMasterPDF.tsx`) — these currently quote struck-through onboarding pricing as the headline; leave the numbers as reference ("regular onboarding fee equals one month of plan") but add "waived during Beta" so PDFs don't contradict the site.
- `src/lib/auraInterceptSalesPrompt.ts` + `supabase/functions/_shared/aura-intercept-sales-prompt.ts` — update the Aura sales pitch's onboarding-fee lines to say "$0 during Beta"
- Update memory: `mem://billing/launch-pricing` and the core index line about onboarding pricing

⚠️ **Risk callout:** flipping the global waiver means the `onboarding_fee_status` for every new signup becomes `'waived'`. Confirm this is the intended reporting behavior (vs `'charged'` at $0), and that no downstream analytics/edge functions branch on `waived` in a way that would suppress signup events.

---

## Suggested execution order
1. **A** (pure text) — safest, ship first
2. **B** (one-line constant, uses existing shared module) — ship with A
3. **D** (behavior + copy across many files) — test full signup end-to-end (with and without beta code) after
4. **C** (Stripe billing logic) — test in Stripe test mode with two simulated referral conversions before merging

## Open questions before build
1. Do you want the PDFs' onboarding-fee section rewritten to lead with "$0 during Beta" (with the tier prices as the post-Beta reference), or leave PDFs showing tier prices and only change web/app UI?
2. Should `onboarding_fee_status` be `'waived'` (matches waiver semantics) or `'charged'` with `$0` (cleaner analytics of "who was auto-onboarded")?
3. For Prompt C: if `price.unit_amount` is null, do you want to skip the credit + log, or fall back to the tier's canonical price from `LEGACY_TIER_MAP`/launch pricing?