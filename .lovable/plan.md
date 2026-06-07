## Goal

Beta code `BETA-7372424` currently waives the onboarding fee entirely. Change it so that until **Aug 1, 2026**, beta signups pay a **reduced onboarding fee capped at $497** per tier:

| Tier | Standard onboarding (sale) | Beta onboarding (until Aug 1, 2026) |
|---|---|---|
| Core | $249 | $249 (no change — already under cap) |
| Boost | $449 | $449 (no change — already under cap) |
| Pro | $899 | **$497** (capped) |
| Elite | $1,549 | **$497** (capped) |

After Aug 1, 2026 the cap stops applying and beta users pay the standard tier onboarding fee. The 60-day trial benefit stays unchanged before and after that date.

## Changes

### 1. DB — replace "waive" flag with a capped fee model
New migration: keep `waive_onboarding_fee` for back-compat but add two new columns to `beta_invite_codes`:
- `onboarding_fee_cap_cents int` (e.g. 49700)
- `onboarding_cap_expires_at timestamptz` (Aug 1, 2026 00:00 UTC)

Update the `BETA-7372424` row: `waive_onboarding_fee = false`, `onboarding_fee_cap_cents = 49700`, `onboarding_cap_expires_at = '2026-08-01T00:00:00Z'`.

Update `validate_beta_code()` to also return `onboarding_fee_cap_cents` and `onboarding_cap_expires_at` so the UI and edge function can compute the effective fee.

### 2. Edge function `create-checkout`
Replace the current "skip onboarding line item" branch with:
- If `betaCode` valid AND `onboarding_cap_expires_at > now()` AND tier's standard onboarding price > cap:
  - Drop the standard `onboarding_price_id` line item.
  - Add a one-time `price_data` line item: `unit_amount = onboarding_fee_cap_cents`, name `"Beta Onboarding (capped) — {Tier}"`.
- Else: use the standard tier `onboarding_price_id` (Core/Boost stay unchanged; Pro/Elite after Aug 1 use full fee).
- Trial (60 days) keeps applying for any valid beta code regardless of date.

### 3. UI — `BetaCodeInput` + Subscription page
- `BetaCodeInput` already shows `applied.waive_onboarding_fee` — change the chip copy to read the effective fee. Add a helper `getEffectiveBetaOnboarding(tier, applied)` in `src/lib/launchPricing.ts` returning `{ amount, capped, expiresAt }`.
- On `Subscription.tsx` tier cards: when a beta code is applied AND the cap is active AND the tier qualifies, show the onboarding line as `~~$899~~ $497  Beta cap` (Pro) / `~~$1,549~~ $497  Beta cap` (Elite). Append fine print: "Beta onboarding cap ends Aug 1, 2026."
- `ThirdPartyFeeNotice` copy unchanged.

### 4. Constants
Add to `src/lib/launchPricing.ts`:
```ts
export const BETA_ONBOARDING_CAP_CENTS = 49700;
export const BETA_ONBOARDING_CAP_EXPIRES_AT = '2026-08-01T00:00:00Z';
```
Used by both UI display and (mirrored as guard) by the edge function.

### 5. Memory
Update `mem://billing/launch-pricing` (and a small note on `Core` index entry) to record the beta cap and its Aug 1, 2026 expiry.

## Files

- `supabase/migrations/<ts>_beta_onboarding_cap.sql` (new) — alter table, update RPC, update seed row.
- `supabase/functions/create-checkout/index.ts` — replace waive branch with cap branch using `price_data`.
- `src/lib/launchPricing.ts` — add cap constants + `getEffectiveBetaOnboarding()` helper.
- `src/components/billing/BetaCodeInput.tsx` — update applied-chip copy to reference the capped fee, not "FREE".
- `src/pages/Subscription.tsx` — show capped onboarding strikethrough on Pro/Elite cards when code applied.
- `mem://billing/launch-pricing` — add Beta Onboarding Cap line.

## Out of scope

- Stripe price IDs: the capped fee uses `price_data` inline (no new permanent Stripe price needed).
- Existing redeemed companies are not retroactively re-billed; the cap only affects future checkouts.
