## Goal

Swap the platform-admin identity from `auraintercept@gmail.com` → `ai@auraintercept.ai`, and convert `auraintercept@gmail.com` into the `company_admin` of the Aura Intercept tenant. This preserves all the Google/Gmail/Calendar/3rd-party OAuth integrations already authorized under `auraintercept@gmail.com` (since those are bound to the Google account, not the role).

## What stays put

- GCP project ownership, Google Workspace, Calendar OAuth tokens, Gmail integration → **remain on `auraintercept@gmail.com`** (that's the whole point).
- `support@`, `sales@` employees → unchanged.
- Aura Intercept company record (`04c57cbe-358e-4036-a3ad-b777a55f5be0`), tier, subscription, Stripe data → unchanged.
- Demo account registry (54 demo accounts) → unchanged.

## Migration steps (executed in safe order)

```text
Step 0 → Reset password for ai@auraintercept.ai to `aiagent*!`
         (matches existing tenant-account password standard).
         Done via service-role admin API in a one-shot edge function.

Step 1 → PROMOTE ai@auraintercept.ai
         INSERT user_roles (ai@.id, 'platform_admin')
         UPDATE profiles SET company_id = NULL WHERE id = ai@.id
         DELETE user_roles WHERE user_id = ai@.id AND role = 'company_admin'

Step 2 → DEMOTE auraintercept@gmail.com
         INSERT user_roles (gmail.id, 'company_admin')
         (profiles.company_id already = Aura Intercept — no change needed)
         DELETE user_roles WHERE user_id = gmail.id AND role = 'platform_admin'
```

All as one SQL migration so it's atomic.

## Files to update

### Database
- **New migration** — performs Steps 1 & 2 above (atomic role swap).

### Edge function (one-shot password reset)
- `supabase/functions/seed-aura-intercept/index.ts` — flip the role table:
  - `auraintercept@gmail.com` → `company_admin` (added to seed list, password `aiagent*!`)
  - `ai@auraintercept.ai` → excluded (treated like the platform admin used to be)
  - On rerun, idempotently resets `ai@auraintercept.ai` password to `aiagent*!` before promoting (Step 0).

### UI
- `src/pages/DemoAccountSeeder.tsx`
  - Display copy: `auraintercept@gmail.com · company_admin` (was `ai@auraintercept.ai · company_admin`)
  - Footer note: "Does NOT touch `ai@auraintercept.ai` (your platform_admin)."

### Memory updates
- `mem://platform-operations/aura-intercept-tenant.md` — swap the email/role table.
- `mem://auth/admin-identity` — clarify the split:
  - **Lovable platform_admin** (god-mode in this app) = `ai@auraintercept.ai`
  - **GCP / Google Workspace owner** (OAuth integrations, Calendar, Gmail) = `auraintercept@gmail.com`
- Index update reflecting the new admin identity rule.

## After migration

1. Sign out everywhere.
2. Sign in as `ai@auraintercept.ai` (password `aiagent*!`) — verify god-mode access at `/dashboard/demo-seeder`, platform-admin gated routes (`/architecture`, `/cyber-sentry-mockup`, etc.).
3. Sign in as `auraintercept@gmail.com` — verify it now lands in the Aura Intercept tenant as company admin and that all Google Calendar / Gmail / OAuth integrations show as connected without re-auth.

## Out of scope

- Re-authorizing any 3rd-party integrations (the swap is specifically designed to avoid this).
- Touching `support@` / `sales@` employees.
- Touching demo accounts.

Reply **approve** to execute the swap.