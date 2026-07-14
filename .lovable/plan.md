Update the trial billing model so the first monthly plan fee is charged on day 61 and the one-time onboarding fee is charged on day 31. This touches customer-facing copy, the Stripe checkout session, and requires a new scheduled job for the deferred onboarding charge.

## What will change

### 1. Customer-facing copy
- `src/components/billing/BetaSignupNotice.tsx`
  - Replace "onboarding fee is due at the start of your trial" with "onboarding fee is invoiced on day 31 after signup".
  - Replace "first month fee" framing so it clearly states monthly plan billing begins on day 61.
- `src/pages/ForBusiness.tsx`
  - Update the Elite demo CTA subtext from "No setup fee during beta" to language matching the day-31/day-61 schedule.
  - Update the sticky banner and final CTA copy as needed.
- `supabase/functions/submit-onboarding/index.ts`
  - Update the customer confirmation email step that says "onboarding fee is invoiced at the start".
- `supabase/functions/_shared/aura-intercept-sales-prompt.ts`
  - Update the trial description so the AI agent states the correct schedule.

### 2. Project memory
- `.lovable/memory/product/trial-period-standard.md`
  - Change "onboarding fee is invoiced at the START of the trial" to "onboarding fee is invoiced on day 31; first monthly plan fee is charged on day 61".

### 3. Stripe checkout logic (`supabase/functions/create-checkout/index.ts`)
- Remove/override the `ONBOARDING_FEE_WAIVED_GLOBALLY = true` waiver for new signups so the onboarding fee is actually collected.
- Set the subscription trial to 60 days so the first monthly charge occurs on day 61.
- Do **not** add the onboarding price to the checkout line items (it would bill immediately).
- Record the pending onboarding fee in the database so a scheduled job can invoice it on day 31.

### 4. New scheduled onboarding charge
- New edge function `supabase/functions/charge-onboarding-fee/index.ts`
  - Runs daily (cron), finds companies whose onboarding fee is due today (day 31 from signup/trial start) and status = `pending`.
  - Creates a Stripe invoice for the tier-specific onboarding amount and attempts to charge the customer's default payment method.
  - Updates the database record to `charged`/`failed` with Stripe invoice ID and error info.
- New migration
  - Adds `onboarding_fee_cents`, `onboarding_fee_due_at`, `onboarding_fee_status`, and `onboarding_fee_stripe_invoice_id` columns to `public.companies`.
  - Registers the daily cron job using the existing `pg_cron` + `_cron_shared_secret` pattern.

### 5. Verification
- Typecheck the frontend.
- Deploy edge functions and run a quick curl test against `create-checkout` in test mode if possible.
- Confirm the cron job is registered in the migration.

## Out of scope for this pass
- Changing the 60-day trial length or reminder email schedule.
- Refactoring the beta invite code waiver logic beyond the global waiver flag.
- Updating `/audit` or legal pages unless they also contain the old onboarding-fee wording.

## Questions before I proceed
1. Should the onboarding fee be **waived** for companies that use a beta invite code with `waive_onboarding_fee = true`, or should that flag be ignored now that we're moving to a deferred charge model?
2. For the day-31 invoice: if the customer's payment method fails, should the company be suspended immediately, or should we retry and send reminders (leaving that for a future pass)?