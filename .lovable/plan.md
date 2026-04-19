

## Plan: Recreate Demo Accounts + Data for All 4 Tiers

### Scope

Create **4 demo companies** (one per tier), each with **1 admin + 1 employee + 1 customer** = **12 auth users total**, plus realistic demo data scoped to each company's tier.

### Account matrix

| Tier | Company | Admin Email | Employee Email | Customer Email |
|---|---|---|---|---|
| Aura Core ($197) | Demo Core | corecompany@demo.com | coreemployee@demo.com | corecustomer@demo.com |
| Aura Boost ($497) | Demo Boost | boostcompany@demo.com | boostemployee@demo.com | boostcustomer@demo.com |
| Aura Pro ($997) | Demo Pro | procompany@demo.com | proemployee@demo.com | procustomer@demo.com |
| Aura Elite ($1,997) | Demo Elite | elitecompany@demo.com | eliteemployee@demo.com | elitecustomer@demo.com |

**Universal password:** `aidemo*!` (12 chars, meets policy)

Internal tier values written to `companies.subscription_tier`: `starter`, `connect`, `performance`, `command` (per `LEGACY_TIER_MAP` — display names map to these IDs).

### Implementation (default mode)

**1. New edge function: `seed-demo-accounts-v2`** (admin-gated, idempotent)

Why an edge function: the AI cannot directly insert into `auth.users`. The function uses the service-role key to call `supabase.auth.admin.createUser` with `email_confirm: true` (no email verification needed for demos).

Logic per tier:
1. Create company row with tier, slug (`demo-{tier}`), branding, business hours, service area.
2. Create 3 auth users with `email_confirm: true`, password `aidemo*!`.
3. Insert profiles (linked via `handle_new_user` trigger), set `company_id` on admin + employee profiles.
4. Insert `user_roles`: admin → `company_admin`, employee → (no platform role; gets job assignment), customer → `customer`.
5. Insert `employee_job_assignments` for employee (job_type = `technician`).
6. Insert `customer_company_associations` linking customer → company.
7. Seed agent-driven demo data (see next section).

Idempotency: check for existing `@demo.com` users / `demo-{tier}` company before creating; safe to re-run.

**2. Demo data seeded per company** (scaled by tier's available agents from `TIER_AGENT_CONFIG`)

For each company, insert sample rows so every tier-available AI agent has visible activity:

| Agent | Data seeded |
|---|---|
| triage / booking | 5 appointments (mix of scheduled/completed/cancelled) |
| followup | 3 follow-up SMS in `call_logs` |
| review | 2 review request entries |
| lead | 6 leads (varied scores: hot/high/normal) |
| marketing / campaign | 2 campaign rows |
| outreach | 3 outreach contacts |
| creative_content | 3 blog posts + 4 content_images entries |
| web_presence | 1 `smart_websites` row (published) |
| dispatch / route / eta / checkin | 4 `job_assignments` (Boost+) |
| quoting / invoice | 3 quotes + 3 invoices (Elite only) |
| inventory | 8 inventory_items (Elite only) |
| social_scheduler / social_analytics | 4 social posts queued (Pro+) |
| insights / performance / revenue / forecast | 30 days of `subscription_usage_tracking` rows (Elite) |

All data dated within last 60 days for realistic dashboards. Customer profiles for each company include the seeded customer + 4 additional sample customers (5 total per company).

**3. UI: Admin "Seed Demo Accounts" button**

Add a single button in `src/pages/PlatformAdmin.tsx` (or similar admin-only page) that calls the new edge function. Restricted to `platform_admin` role only.

**4. Memory update**

Recreate `mem://platform-operations/demo-account-registry` with the new credentials and add to the index.

### Security

- Edge function checks caller's JWT for `platform_admin` role before any inserts.
- `verify_jwt = true` (default); rejects unauthenticated calls with 401.
- All passwords stored only in Supabase Auth (hashed); no plaintext logs.
- Demo emails use `@demo.com` so future cleanup migrations can target them safely (same pattern as the recent purge).

### Files to create/edit

- **Create:** `supabase/functions/seed-demo-accounts-v2/index.ts`
- **Create:** SQL migration only if helper functions are needed (likely none — service-role inserts handle everything)
- **Edit:** `src/pages/PlatformAdmin.tsx` — add seed button
- **Create:** `mem://platform-operations/demo-account-registry`
- **Edit:** `mem://index.md` — re-add registry entry

### Verification after run

- `SELECT count(*) FROM auth.users WHERE email LIKE '%@demo.com'` → 12
- `SELECT count(*) FROM public.companies WHERE slug LIKE 'demo-%'` → 4
- Login test for each of the 4 admin accounts; confirm correct tier features unlock.

