# Onboarding Email + Token Gate

## 1. Hide Fast Start toggle on `/onboarding`

`src/pages/OnboardingForm.tsx`
- Remove the Fast Start / Full Setup toggle UI.
- Always render `<CompanyOnboardingForm />`. Keep `FastStartWizard` import/component in repo for now (not deleted).
- Page becomes token-gated (see §2).

## 2. Token-gate the `/onboarding` page

`/onboarding` will require a valid invite token before showing the workbook.

- New behavior: `OnboardingForm` reads `?token=...` from URL (or a "paste your code" input when missing).
- On mount, call existing `get-onboarding-invite` edge function to validate. If invalid/expired → render a "Enter your onboarding code" gate screen with an input + Continue button. If valid → render `<CompanyOnboardingForm />` with the token in context.
- Gate screen explains: "Your onboarding code was emailed to you at signup. Paste it here to begin."

No new edge function needed — `get-onboarding-invite` already validates tokens server-side.

## 3. Auto-create invite + send welcome email at company signup

`src/pages/Auth.tsx` (company signup success path)
- After the `companies` insert succeeds, invoke a new edge function `send-company-welcome` with `{ company_id, company_name, recipient_email }`.
- Non-fatal: log on error, do not block the navigation flow.

New edge function `supabase/functions/send-company-welcome/index.ts` (`verify_jwt = false`, called from client right after auth signup):
1. Generate a URL-safe 32-byte token (same pattern as `create-onboarding-invite`).
2. Insert row into `onboarding_invites` (token, company_name, recipient_email, expires_at = +30d). Skip the `created_by` admin requirement.
3. Build the onboarding link: `https://auraintercept.ai/onboarding?token={token}`.
4. Generate the onboarding workbook PDF in-function (see §4) and attach to the email.
5. Send via Resend (gateway) directly so we can pass `attachments` (the existing `sendGuardedEmail` helper doesn't support attachments). Use `RESEND_API_KEY` secret already present.
6. Subject: `Welcome to Aura Intercept — your onboarding link & workbook`.
7. Body: greeting, "Open your onboarding workbook" CTA button to the link, note about the attached PDF (printable copy), 30-day expiry, support contact.

## 4. PDF auto-generation

Generate inside the edge function using `pdf-lib` (Deno-compatible, no native deps):
- Import `https://esm.sh/pdf-lib@1.17.1`.
- Build a branded multi-page document from the workbook sections already used by `CompanyOnboardingForm` (business profile, contact routing, hours, employees, services, integrations, signature block). Pull section titles + field labels from a small shared constants file `supabase/functions/_shared/onboarding-workbook-sections.ts` so the printed PDF mirrors the online form.
- Output as Uint8Array → base64 → Resend `attachments: [{ filename: 'Aura-Intercept-Onboarding-Workbook.pdf', content }]`.

The same constants file can later be imported by `CompanyOnboardingForm` for a single source of truth (out of scope for this patch — just create the file).

## 5. Admin path unchanged

`create-onboarding-invite` (platform-admin manual sends) remains as-is for ad-hoc invites; it continues to use the existing `/intake/{token}` link. The new self-serve signup flow uses `/onboarding?token=...` exclusively.

## Files

**Create**
- `supabase/functions/send-company-welcome/index.ts` — token + PDF + Resend send
- `supabase/functions/_shared/onboarding-workbook-sections.ts` — section/field metadata for PDF
- (no migration — `onboarding_invites` already exists)

**Edit**
- `src/pages/OnboardingForm.tsx` — remove toggle, add token gate
- `src/pages/Auth.tsx` — call `send-company-welcome` after company creation

**Out of scope**
- No changes to pricing, beta-code, or Subscription page.
- No edits to `auth.users` or `companies` schema.
- Fast Start component left in repo (hidden only).
