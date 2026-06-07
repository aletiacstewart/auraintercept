# Split Auth into /signin and /signup

`src/pages/Auth.tsx` (1,595 lines) currently houses both login and signup inside a `Tabs` component, with URL syncing via `?tab=login|signup`. Split it into two dedicated pages with their own routes.

## New routes

- `/signin` → `src/pages/SignIn.tsx` — login form only (email/password + Google + forgot password link)
- `/signup` → `src/pages/SignUp.tsx` — full company signup flow (tier picker, billing toggle, address, industry, compliance, T&Cs, etc.)
- `/auth` → kept as a back-compat redirect:
  - `?tab=login` or `?mode=employee` or `?source=qr` → redirect to `/signin` (preserve query)
  - everything else → redirect to `/signup`

Each page links to the other ("Already have an account? Sign in" / "New here? Create an account").

## Implementation steps

1. Create `src/pages/SignIn.tsx` — extract the login branch from `Auth.tsx` (state: email, password, isLoading; handlers: `handleSignIn`, Google OAuth, forgot-password modal). Strip out all signup-only state.
2. Create `src/pages/SignUp.tsx` — extract the signup branch (tier selection, billing, company fields, compliance, acknowledgements, `handleSignUp`). Strip out login-only logic and the `Tabs` wrapper.
3. Extract shared helpers (password validation, beta code check, OAuth handler, branding header) into `src/components/auth/` if duplication is significant; otherwise inline-copy for now.
4. Replace `src/pages/Auth.tsx` body with a small redirect component that reads `mode/tab/source` and `<Navigate>`s to `/signin` or `/signup` with the original query string preserved.
5. Update `src/App.tsx`: add `<Route path="/signin" element={<SignIn />} />` and `<Route path="/signup" element={<SignUp />} />` alongside the existing `/auth` route.
6. Update internal links across the app that currently point to `/auth?tab=login` or `/auth?tab=signup` (CTAs on `Index.tsx`, footer, nav, customer/employee redirects) to point at `/signin` and `/signup` directly. Keep `/auth` working via redirect so any external/published links don't break.

## Out of scope

- No changes to `CustomerAuth` (separate flow).
- No changes to auth logic, validation rules, Stripe tier mapping, or backend.
- No visual redesign — same Cyber-Sentry styling and copy.

## Technical notes

- Both pages must keep the `onAuthStateChange` listener pattern from the current file.
- Preserve the QR-source / employee-mode forced-login behavior by routing those cases to `/signin` in the `/auth` redirect.
- Forgot-password modal stays in `SignIn.tsx` only.
- The launch-pricing strikethrough + "Launch Pricing" chip behavior in tier cards stays in `SignUp.tsx` unchanged.
