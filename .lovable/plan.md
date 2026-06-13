## Goal
Make `auraintercept@gmail.com` see every new company signup in real time — on their dashboard, by email, and via a persistent ownership link — without breaking their existing `company_admin` tenant access.

## Key constraint (from memory)
Identity Split memory says `ai@auraintercept.ai` is the canonical Lovable `platform_admin` and `auraintercept@gmail.com` is the Aura Intercept tenant `company_admin`. This change explicitly grants `auraintercept@gmail.com` the `platform_admin` role in ADDITION to its existing `company_admin` role so it has platform-wide oversight. The identity-split memory will be updated to record the dual-role grant.

## Changes

### 1. Database migration — dual role + ownership link
- Insert `user_roles` row granting `platform_admin` to user `5e877645-4201-49f5-9fca-9efe06548ff9` (`auraintercept@gmail.com`). Existing `company_admin` row stays.
- Add column `companies.managed_by_admin_id uuid` (nullable, no FK to auth.users per Cloud rules).
- Trigger `trg_assign_company_owner` on `INSERT` to `companies`: sets `managed_by_admin_id` to the first `user_roles.user_id` with role `platform_admin` (deterministic by `created_at`) when the inserter did not provide one and `is_demo = false`.
- Trigger `trg_notify_platform_admins_on_signup` on `INSERT` to `companies` (skip `is_demo`): inserts a row into existing `staff_notifications` for every `platform_admin` user with `type='new_company_signup'`, payload `{ company_id, name, tier, industry, trial_ends_at }`. Also fires `pg_net.http_post` to the new edge function below.
- GRANTs unchanged (companies already has them).

### 2. Edge function `notify-platform-on-signup`
- Receives `{ company_id }`, loads company + every `platform_admin` profile email, sends a single Resend email with subject `New Aura signup: {name} ({tier} / {industry})` and a deep link `https://auraintercept.ai/dashboard/companies`. `verify_jwt = false`, input-validated, idempotent on company_id (skip if `metadata.signup_notified_at` already set on the company).

### 3. Auth context — support dual roles
- `fetchUserData` currently calls `.maybeSingle()` on `user_roles` which fails if a user has 2+ roles. Switch to fetch all rows, prefer `platform_admin` > `company_admin` > others when setting the active `userRole`. No other code changes — every consumer keeps reading a single `userRole`.

### 4. Platform Admin Dashboard widget — "New Signups (last 7 days)"
- New card in `PlatformAdminDashboard.tsx` above the existing snapshot.
- Lists up to 10 most recent non-demo `companies` with: name, tier badge, industry chip, trial day `n/60`, signup time, and two buttons: `Open in Switcher` (routes through `useSuperSwitcher` → that company's dashboard) and `View profile` (→ `/dashboard/companies` filtered).
- Live via React Query with `refetchInterval: 60_000`; deduped against the staff_notifications bell so the badge count clears when admin views the widget.

### 5. Memory update
- Patch `mem://auth/admin-identity` to record: `auraintercept@gmail.com` now holds BOTH `company_admin` (Aura Intercept tenant) AND `platform_admin` (oversight of all signups). `ai@auraintercept.ai` remains the canonical Lovable platform admin.

## Out of scope
- No change to who can sign up, the trial length, pricing, or the signup form itself.
- No changes to demo seeding (still `is_demo=true`, still excluded from signup notifications).
- No new sub-admin / company assignment UI — `managed_by_admin_id` is set automatically and surfaced read-only for now.
- No SMS/push notification on signup (only email + in-app bell).
