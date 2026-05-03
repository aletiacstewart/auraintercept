# Phase 2 — Auth, Onboarding, Trial, Roles

## Findings

### Critical (data loss / compliance gap)
1. **Compliance documents are silently discarded.** `src/pages/Auth.tsx` collects `complianceFiles` (DBA, EIN, LLC/Inc) for FCC 10DLC registration but never uploads them anywhere. After signup the files vanish — there is no Storage upload, no DB row, no edge-function call. Compliance promise on the signup screen is broken.
2. **No `compliance-docs` storage bucket exists.** Storage currently has 8 buckets, none for tenant onboarding compliance.

### High (branding / billing model drift)
3. **Trial reminder emails violate "bundled Resend" rule.** `supabase/functions/trial-reminders/index.ts` reads `tenant_integrations.resend_api_key` per-company and skips companies without a key. Per memory, Resend is bundled into the tier — the platform key (`RESEND_API_KEY` env) must be used so every trialing company gets reminders.
4. **Wrong sender domain.** Trial reminders send from `noreply@aura-intercept.com`; the canonical domain is `auraintercept.ai`. `lead-follow-up-reminders` falls back to `noreply@resend.dev`.

### Medium (security)
5. **Customer signup allows 6-char passwords.** `src/pages/CustomerAuth.tsx` uses `z.string().min(6)`, while company/employee signup enforces 8+ via `passwordSchema` and HIBP. Inconsistent and weaker than platform standard.

### Verified OK (no change needed)
- Real-signup tier/industry persistence (validates against `['starter','connect','performance','command']`, blocks invalid industry, sets `is_demo:false`, 90-day `trial_ends_at`).
- `initialize-company-agents` invoked on signup so dashboard/operatives are provisioned.
- `customer-register` edge fn: rate-limited, HIBP-checked, generic error messages, role assigned, association created.
- `useOnboardingState` profile read/write + localStorage fallback.
- Trial math: 90 days everywhere (`Date.now() + 90*24*60*60*1000`, reminders at 7/3/1 days).
- Employee signup: registration-code validation, single-use marking, role insert.
- Role separation: `company_admin`, `employee`, `customer`, `platform_admin` consistent across `ProtectedRoute` and signup paths.

## Fixes to apply

### 1. Persist compliance documents (DB + Storage + UI wiring)
- New private storage bucket `compliance-docs` (RLS: company_admin can read/write own company folder, platform_admin can read all).
- New table `public.company_compliance_documents` (`id`, `company_id`, `uploaded_by`, `file_path`, `file_name`, `mime_type`, `size_bytes`, `doc_type` enum {dba, ein, formation, other}, `status` enum {pending, approved, rejected}, `created_at`). RLS: company_admin sees own, platform_admin sees all.
- In `Auth.tsx` `handleSignUp`, after company creation: loop `complianceFiles`, upload each to `compliance-docs/{company_id}/{uuid}-{filename}`, insert metadata row (`doc_type: 'other'` until UI lets them tag), surface a toast if any upload fails but do NOT block signup.

### 2. Trial reminders use bundled platform Resend
- Edit `supabase/functions/trial-reminders/index.ts` to read `Deno.env.get('RESEND_API_KEY')` once at startup, drop the per-company `tenant_integrations` lookup and skip-on-missing branch.
- Change `from` to `Aura Intercept <noreply@auraintercept.ai>` in both reminder and expired branches.

### 3. Lead follow-up sender
- Edit `supabase/functions/lead-follow-up-reminders/index.ts`: replace `noreply@resend.dev` fallback with `noreply@auraintercept.ai` (keep `${companyName}` display name).

### 4. Customer password floor → 8 chars
- `src/pages/CustomerAuth.tsx`: `passwordSchema = z.string().min(8, 'Password must be at least 8 characters')`. (HIBP check stays as-is server-side via existing pattern — optional follow-up.)

## Files to touch
- New migration: `compliance-docs` bucket, `company_compliance_documents` table + RLS + storage policies.
- `src/pages/Auth.tsx` — upload loop after company insert.
- `src/pages/CustomerAuth.tsx` — bump password min.
- `supabase/functions/trial-reminders/index.ts` — platform key + sender domain.
- `supabase/functions/lead-follow-up-reminders/index.ts` — sender domain.

## Out of scope for Phase 2 (will surface in later phases)
- Admin UI to review/approve compliance docs (Phase 3 — admin dashboards).
- Migrating other transactional emails to platform Resend (Phase 6 — comms).
- Auto-tagging uploaded compliance docs by filename/AI classification.

After approval I'll implement all five fixes in one pass and report back before starting Phase 3.
