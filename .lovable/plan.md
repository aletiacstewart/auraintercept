## Goal

Make the admin **Onboarding Invites** page (`/dashboard/onboarding-invites`) the single source of truth for *every* onboarding code that goes out and *every* completed submission — whether the code came from an admin "Send invite" or from the auto-sent welcome email after company signup.

## What's wrong today

Two parallel flows exist and only one is wired to the admin list:

1. Admin → `create-onboarding-invite` → user opens `/intake/:token` → `submit-onboarding` writes to `onboarding_submissions` + `onboarding_uploads`. Shows up correctly with View / PDF / Download.
2. Company signup → `send-company-welcome` (creates a row in `onboarding_invites`, good) → user opens `/onboarding?token=...` → `CompanyOnboardingForm` currently just opens a `mailto:` link and saves **nothing**. The invite row stays `pending` forever and there's no submission attached, so the admin page has nothing to View/Download for these companies.

So the invite rows from signup *do* already list (same table) — but the completed submission never lands anywhere the admin page can read.

## Changes

### 1. `src/pages/OnboardingForm.tsx`
- Pass the validated `token` (from URL or paste-gate) down to `<CompanyOnboardingForm token={token} />` so the form knows which invite to attach its submission to.
- Platform-admin preview keeps `token = null` (no submission written, just renders the form).

### 2. `src/components/onboarding/CompanyOnboardingForm.tsx`
Replace the `mailto:` `handleSubmit` with a real persisted submission:
- If `token` prop is present, call `supabase.functions.invoke('submit-onboarding', { body: { token, form_data: formData, signature: { signer_name, signer_title } } })` — reuses the existing edge function that already writes to `onboarding_submissions` and flips the invite to `status='submitted'`.
- Wire any file fields (logo upload, etc.) through the existing `upload-onboarding-file` function (same token) so they land in `onboarding_uploads` and become downloadable from the admin dialog.
- On success: toast "Onboarding submitted — your concierge team has been notified." and disable the form.
- If no token (admin preview), keep current preview-only behavior with a "Preview mode — not saved" notice.

### 3. `src/pages/admin/OnboardingInvites.tsx`
Minor polish so it's obviously unified:
- Update the header copy to: *"All onboarding codes — both admin-sent and auto-sent at signup — and their completed submissions."*
- Add a small **Source** column (`admin` vs `signup`) derived from a new optional `source` field on the invite row (default `admin`).
- Show the **Open** link as `/onboarding?token=...` for `source=signup` rows and `/intake/:token` for `source=admin` rows, so clicking opens the same page the customer received.
- Keep View / PDF / Download exactly as-is — they already work for any row with a submission.

### 4. Database migration
Add a `source TEXT NOT NULL DEFAULT 'admin'` column to `public.onboarding_invites` (values: `'admin' | 'signup'`). Backfill existing rows to `'admin'`. Update `create-onboarding-invite` to insert `source: 'admin'` and `send-company-welcome` to insert `source: 'signup'`.

## Out of scope
- No changes to `submit-onboarding`, `upload-onboarding-file`, `get-onboarding-invite`, the PDF builder, or RLS.
- No changes to the `/intake/:token` route or `PublicOnboardingIntake`.
- No changes to the welcome email or workbook PDF content.
- No new tables; reusing `onboarding_invites` / `onboarding_submissions` / `onboarding_uploads`.

## Result
Every code Aura sends (admin or signup) appears in one list. The moment a customer finishes their workbook at `/onboarding?token=…`, the row flips to `submitted`, and the admin can click **View**, **PDF**, or **Download** for each uploaded file — identical to the existing `/intake` flow.
