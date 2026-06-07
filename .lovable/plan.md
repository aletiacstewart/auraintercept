## Issue

`BetaCodeInput` lives only on `/dashboard/subscription`. New companies signing up at `/auth?mode=company` never see it, so they can't unlock the 60-day trial or $497-capped beta onboarding before they finish signup.

## Fix

### 1. Add `BetaCodeInput` to company signup
File: `src/pages/Auth.tsx`
- Add state: `const [betaCode, setBetaCode] = useState<BetaCodeResult | null>(null)`.
- Render `<BetaCodeInput applied={betaCode} onApplied={setBetaCode} />` inside the company-mode signup form, placed just above the "Required Acknowledgments" block so it sits with the other commercial fields.
- When a code is applied, show a short helper line: "60-day free trial + Beta Onboarding capped at $497 will apply at checkout."

### 2. Persist on company creation
In the `companies` insert at signup, when `betaCode` is set:
- `beta_trial: true`
- `beta_code: betaCode.code`
- Trial length: extend `trialEndsAt` to `now + betaCode.trial_days * 86400000` (60 days) instead of the current 90-day default.

Also fire a best-effort `supabase.rpc('redeem_beta_code', { p_code, p_company_id })`. Because `redeem_beta_code` is currently `service_role` only, also add a migration to `GRANT EXECUTE ... TO authenticated` (the function is idempotent-guarded and only flips the caller's own row server-side) — or wrap redemption in a tiny `redeem-beta-code` edge function. Pick the GRANT path since it's simpler and the function already revalidates the code and updates by `p_company_id` which is RLS-isolated.

### 3. Carry code into Subscription page
After successful signup, when navigating to `/dashboard/subscription`, append `?beta_code=BETA-7372424`. Update `Subscription.tsx` to read `useSearchParams().get('beta_code')` on mount and auto-validate it into `betaCode` state so the user sees the chip + capped onboarding immediately on checkout.

## Files

- `src/pages/Auth.tsx` — render BetaCodeInput, persist on signup, redirect with `?beta_code`.
- `src/pages/Subscription.tsx` — auto-apply `?beta_code` URL param.
- `supabase/migrations/<ts>_grant_redeem_beta_code.sql` — `GRANT EXECUTE ON FUNCTION public.redeem_beta_code(text, uuid) TO authenticated;`

## Out of scope

No changes to pricing logic, edge function, or the cap rules — those are already wired correctly server-side. This patch is purely surfacing the existing beta entry point on the signup screen.
