## Goal

Turn the Company Onboarding Workbook PDF into a **shareable web intake page** companies can fill in their browser. On submit, a polished PDF + all uploaded files are emailed to `ai@auraintercept.ai`.

## How it works (user-facing)

1. Admin opens `/dashboard/onboarding-invites`, enters a company name + contact email, clicks **Send Invite**.
2. Recipient gets an email with a unique, signed link: `https://auraintercept.ai/intake/{token}`.
3. They fill out the workbook (same sections as the PDF — broken into ~10 friendly steps with autosave). They can upload logos, EIN/W-9, customer/employee CSVs, brand assets, etc.
4. They e-sign the Terms of Service inline (typed signature + IP/timestamp capture).
5. On **Submit**, they see a confirmation page. The platform admin gets an email with the generated PDF + every uploaded file as attachments (or download links if total >20 MB).

## Architecture

### Database (new)
- `onboarding_invites` — `id`, `token` (unguessable, 32-byte), `company_name`, `recipient_email`, `status` (`sent` / `in_progress` / `submitted`), `expires_at` (30 days), `created_by`, `submitted_at`.
- `onboarding_submissions` — `id`, `invite_id` (FK), `form_data` jsonb (all answers), `signature` jsonb (name, title, signed_at, ip), `submitted_at`.
- `onboarding_uploads` — `id`, `invite_id`, `section` (e.g. `logo`, `ein_w9`, `customer_csv`), `file_name`, `storage_path`, `mime_type`, `size_bytes`.
- Storage bucket `onboarding-uploads` (private). Files stored under `{invite_id}/{section}/{filename}`.

### Access model
- All three tables: **no anon SELECT**. Platform admins can read everything.
- Public access is handled exclusively through **edge functions** that validate the token server-side (SECURITY DEFINER RPCs). No client-side Supabase reads via token.

### Edge functions
- `create-onboarding-invite` (auth required, platform_admin only) → generates token, inserts row, sends invite email via the existing send-email-guarded path.
- `get-onboarding-invite` (public) → validates token, returns `{ company_name, status, saved_form_data }`.
- `save-onboarding-progress` (public, token-gated) → upserts partial `form_data` for autosave.
- `upload-onboarding-file` (public, token-gated) → accepts multipart, stores in private bucket, inserts `onboarding_uploads` row, returns metadata.
- `submit-onboarding` (public, token-gated) → marks submitted, renders PDF (server-side using `@react-pdf/renderer` rehydrated with the same `CompanyOnboardingPDF` component), gathers signed URLs for each upload (7-day expiry), and emails admin with PDF attached + links to uploads. If combined attachments fit under ~15 MB, attach files directly; otherwise attach PDF only and include signed download links in the body.

### Frontend pages
- `/intake/:token` — public, no auth. Loads invite via edge function. If invalid/expired → friendly error. Otherwise renders a multi-step wizard mirroring the PDF sections (Company Profile, Brand & Voice, 3rd-Party Accounts, A2P 10DLC, Communication Routing, Employees, Booking Rules, Industry-Specific Intake, Smart Website, Goals, Document Uploads, Terms of Service, Review & Submit). Autosaves on step change. Mobile-friendly. Uses existing Cyber-Sentry theme tokens.
- `/dashboard/onboarding-invites` — platform_admin only. Table of invites with status, copy-link, resend, view-submission. "New Invite" dialog.

### Security
- Tokens are 32-byte URL-safe base64, unique-indexed, expire in 30 days. Edge functions reject expired/submitted tokens for write ops.
- Uploads: server-side validation of mime type (images, PDF, CSV, XLSX, DOCX) and size (≤20 MB/file, ≤100 MB total per invite).
- Private storage bucket; only edge function (service role) can read for emailing.
- IP + user-agent captured for signature audit.
- Rate-limit uploads/saves per token (simple in-memory or table counter).

### Email
- Uses existing `send-email-guarded` with platform Resend key. From: `onboarding@notify.auraintercept.ai` (or current default). To admin: `ai@auraintercept.ai`. Subject: `New onboarding submission — {Company Name}`.

## Out of scope
- Keeping the existing PDF generator (it stays — used both for downloadable workbook AND server-rendered final submission).
- Stripe collection / payment within the form.
- Multi-signer / countersignature workflow.
- E-signature legal certification (DocuSign-grade) — typed signature + IP/timestamp only.

## Files

**New**
- `supabase/migrations/<ts>_onboarding_intake.sql` — tables, RLS, storage bucket + policies.
- `supabase/functions/create-onboarding-invite/index.ts`
- `supabase/functions/get-onboarding-invite/index.ts`
- `supabase/functions/save-onboarding-progress/index.ts`
- `supabase/functions/upload-onboarding-file/index.ts`
- `supabase/functions/submit-onboarding/index.ts`
- `src/pages/PublicOnboardingIntake.tsx` (+ step components under `src/components/intake/`)
- `src/pages/admin/OnboardingInvites.tsx`

**Edited**
- `src/App.tsx` — add `/intake/:token` (public) and `/dashboard/onboarding-invites` (admin) routes.
- Sidebar nav — add "Onboarding Invites" under platform admin section.

## Open question

Do you want recipients to be able to **resume later from the same email link** (current plan, autosave keyed to token), or should the link be single-use and they finish in one sitting?
