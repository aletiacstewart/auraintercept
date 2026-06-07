
## Goal
Add a one-shot beta invite code (`BETA-7372424`) the user can redeem at signup/checkout. Redeeming gives the new company:
- $0 plan charges for 60 days (≈ 14–30 day onboarding window, then 30 days full live use)
- $0 Beta Onboarding fee (replaces the normal one-time onboarding fee)
- Clear disclosure that all 3rd-party fees (SignalWire, ElevenLabs, Resend, Tavily, Stripe, A2P 10DLC, Social) are **NOT** covered and require the customer's own credit card on file during the live trial.

## Scope
Frontend redemption flow + backend validation + Stripe checkout in "beta trial" mode. Existing 60-Day Live Trial scaffolding (`trial_ends_at`, TrialBanner math, reminder emails) is reused.

## Plan

### 1. DB: beta invite codes table
Create migration `beta_invite_codes`:
- `code` (text, unique, uppercase)
- `label`, `max_redemptions` (default 1), `redemptions_count`, `expires_at`, `active` (bool)
- `trial_days` (default 60), `waive_onboarding_fee` (bool, default true)
- `redeemed_by_company_id` (nullable), `redeemed_at`
- RLS: locked. Public validation via `SECURITY DEFINER` RPC `validate_beta_code(p_code text)` returning `{ valid, label, trial_days, waive_onboarding_fee, message }` — no anon SELECT on table.
- Seed row: `BETA-7372424`, max_redemptions=∞ (or chosen cap), trial_days=60, waive_onboarding_fee=true, active=true.
- GRANT EXECUTE on RPC to anon + authenticated.

### 2. Signup / Checkout UI
- **`src/pages/Auth.tsx` (signup tab)** + **`src/pages/Subscription.tsx`** (plan picker): add an "Have a beta invite code?" collapsible input. On blur/Apply → call `validate_beta_code`. Show green chip "BETA ACCESS — 60-day free trial, $0 onboarding" or red error.
- Persist applied code in component state + pass to `create-checkout` body as `beta_code`.
- Visible disclosure card under the code input (and on success screen):
  > "Beta trial covers the Aura platform only. All 3rd-party services (voice/SMS via SignalWire, ElevenLabs voices, Resend email, Tavily search, Stripe fees, A2P 10DLC registration, social media APIs) require your own provider account with a valid credit card on file — billed directly by each provider, not Aura."

### 3. `create-checkout` edge function
- Accept `beta_code` in request body.
- If present, re-validate via `validate_beta_code` RPC (server-side authoritative).
- If valid:
  - Skip onboarding `line_items` entry (no onboarding fee).
  - Add `subscription_data: { trial_period_days: 60 }` to the Stripe Checkout session.
  - Pass `metadata.beta_code` + `metadata.beta_trial = "true"`.
  - On success (or via `check-subscription`), mark code redeemed: increment `redemptions_count`, set `redeemed_by_company_id` if single-use.
- If invalid → return 400 with friendly error.

### 4. Trial banner & onboarding copy
- `TrialBanner` (already 60-day math) — when company has `beta_trial = true` (store on `companies` row as `beta_trial boolean` + `beta_code text`), show badge **"BETA TESTER · 60-Day Free Trial"** with the existing progress bar.
- Onboarding screens: when `beta_trial`, swap "Onboarding fee: $XXX" → **"Beta Onboarding: FREE"** + line "Onboarding window: 14–30 days, then 30 days full live use."

### 5. Third-party fee disclosure
- Add reusable `<ThirdPartyFeeNotice />` (uses existing legal disclaimer memory `mem://legal/third-party-fee-disclaimer`). Render on:
  - Checkout step (after beta code applied)
  - Post-signup welcome screen
  - Settings → Subscription page header when `beta_trial = true`

### 6. Email (optional, same turn)
Update existing welcome / trial-start app email template to include a "Beta Tester" section when `beta_trial = true` mirroring the uploaded letter design (Activate Your Beta Access block, invite code echo, 3rd-party disclaimer).

## Files to add / edit
- `supabase/migrations/<ts>_beta_invite_codes.sql` (new)
- `supabase/functions/create-checkout/index.ts` (edit — beta branch)
- `supabase/functions/check-subscription/index.ts` (edit — surface beta_trial flag)
- `src/pages/Auth.tsx`, `src/pages/Subscription.tsx` (add code input + apply UI)
- `src/components/billing/BetaCodeInput.tsx` (new)
- `src/components/billing/ThirdPartyFeeNotice.tsx` (new)
- `src/components/dashboard/TrialBanner.tsx` (beta badge)
- `src/lib/launchPricing.ts` or new `src/lib/betaTrial.ts` (constants)

## Open questions
1. **Redemption cap** for `BETA-7372424` — single-use, fixed N (e.g. 50), or unlimited until you flip `active=false`?
2. Should the beta trial **require a credit card on file at checkout** (Stripe `payment_method_collection: 'always'` so the plan auto-bills on day 61), or **no card required** (manual subscribe after trial)?
3. Onboarding window: **automatic 30 days**, or admin-marks-complete to shorten to 14? Affects when "live trial" countdown displays.
