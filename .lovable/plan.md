# Platform Admin Bypass for /onboarding Token Gate

## Change

`src/pages/OnboardingForm.tsx` — bypass the token gate when the current user is a `platform_admin`.

- On mount, check the session: `supabase.auth.getUser()` → if a user exists, call `supabase.rpc('has_role', { _user_id, _role: 'platform_admin' })`.
- If platform_admin → set state to `unlocked` immediately, skip token validation, and render `<CompanyOnboardingForm />` with no gate.
- Show a small badge at the top of the form: "Platform admin preview" so it's clear the gate was bypassed.
- For everyone else, behavior is unchanged: `?token=...` is validated, otherwise the paste-your-code gate renders.

## Out of scope

- No edge function changes (`get-onboarding-invite` still requires a valid token for non-admins; the bypass is client-side preview only, which is fine because the form itself doesn't submit anything tied to the token until the admin generates one).
- No changes to `Auth.tsx`, `send-company-welcome`, or the PDF generator.
- No new routes or DB migrations.

## Files

- `src/pages/OnboardingForm.tsx` — add admin role check, conditional unlock.
