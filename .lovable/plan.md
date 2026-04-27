## Goal

Make the dynamic `/for-business` demo fully clickable: stop the 404 when the prospect taps "Jobs" on the demo admin dashboard, and always email the three demo logins (admin / technician / customer) — not just when the user opted in to marketing.

## What's actually broken

1. **404 on "Jobs"** — On the admin dashboard, the "Open Jobs" KPI tile in `AuraTodayStrip.tsx` (line 105) links to `/dashboard/field-ops`, which is **not a route** in `src/App.tsx`. The valid routes are `/dashboard/dispatch-field-ops` (Dispatch / Field Ops page) and `/dashboard/ai-consoles/field-ops` (AI console). That single bad href is what produced the 404 the user saw at `/dashboard/field-ops`.

2. **No demo email sent** — `supabase/functions/create-demo-trial/index.ts` only calls Resend when `email_opt_in === true` (line 346). The current demo flow now uses checkboxes that default to unchecked, so prospects who just want the demo never get the credentials email.

3. **Resend isn't configured** — `RESEND_API_KEY` is not set in project secrets, so even when `email_opt_in` was checked, the send was silently skipped (the function only logs `demo email send failed (non-fatal)`).

## Fixes

### 1. Fix the broken Open Jobs tile (no 404)

In `src/components/dashboard/AuraTodayStrip.tsx`, change the Open Jobs tile `href` from `/dashboard/field-ops` to `/dashboard/dispatch-field-ops` (the real Dispatch / Field Ops jobs page that admins use).

### 2. Always email the three demo logins

In `supabase/functions/create-demo-trial/index.ts`:

- Send the credentials email to the prospect on **every** successful demo creation (drop the `email_opt_in` gate for this transactional email — it's not marketing, it's the receipt with their login info and the share link).
- Keep `email_opt_in` and `sms_opt_in` only for follow-up marketing (still saved on `demo_trials`).
- Update the email body to clearly list all three logins (Owner, Technician, Customer) plus the universal password and the `https://auraintercept.ai/demo/{trialId}` share link.
- Use `from: 'Aura Intercept <demos@auraintercept.ai>'` (already in code) and add a plain-text fallback.
- Wrap in try/catch so a Resend failure never blocks the demo response.

### 3. Add the Resend API key

Use the secrets tool to request `RESEND_API_KEY` from the user before deploying, since it isn't set today. The standard Aura Intercept Resend account/domain (`auraintercept.ai`) is already verified for `demos@auraintercept.ai`, so the same key used by other transactional flows will work here.

### 4. Sanity sweep for other dead links on the demo dashboards

While in `AuraTodayStrip.tsx`, verify the remaining tile hrefs (`/dashboard/appointments`, `/dashboard/analytics`, `/dashboard/ai-agents`) are real routes — they are (confirmed in `App.tsx`). No other tile changes needed.

## Files touched

- `src/components/dashboard/AuraTodayStrip.tsx` — single href fix
- `supabase/functions/create-demo-trial/index.ts` — always-send transactional email, improved body
- New secret: `RESEND_API_KEY` (requested via secrets prompt)

## Out of scope

- The screenshot URL bar showed `/dashboard/field-ops` because that link was hard-coded to a missing route — not because of a routing/SPA problem. No router changes are needed.
- The technician demo login is already linked to the same demo company (`employee_user_id` on `demo_trials` is created against the same `company_id` as the admin), so cross-role data already flows. Tested by reading `create-demo-trial` lines 250-340.
- Marketing opt-in checkbox UI stays as-is — only the transactional credentials email becomes unconditional.
