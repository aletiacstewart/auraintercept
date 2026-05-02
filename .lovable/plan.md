# Make Aura Intercept a Real Tenant on Its Own Platform

## What you're getting

Aura Intercept becomes Tenant #1 on its own platform — a fully-wired Elite-tier company so:

1. **You** sign in to a real `company_admin` console (`ai@auraintercept.ai`) and run the SaaS business inside the platform.
2. **Prospect / customer companies** reach Aura Intercept through the same AI chat / voice / SMS / public booking / customer portal stack the platform provides to every other tenant.
3. **`auraintercept@gmail.com` is untouched** — stays as pure `platform_admin` (god-mode for managing all tenants, seeders, platform edits).

## Account layout

| Email | Password | Role | Purpose |
|---|---|---|---|
| `auraintercept@gmail.com` | *(unchanged)* | `platform_admin` only | Manage all tenants, run seeders, edit platform |
| `ai@auraintercept.ai` | `aiagent*!` | `company_admin` of Aura Intercept tenant | Run the SaaS business |
| `support@auraintercept.ai` | `aiagent*!` | `employee` + `technician` job | Support persona — answers inbound chats/tickets |
| `sales@auraintercept.ai` | `aiagent*!` | `employee` + `marketing` + `dispatch` jobs | Sales persona — demo bookings & lead follow-up |

All three tenant accounts link to existing company `04c57cbe-358e-4036-a3ad-b777a55f5be0` ("Aura Intercept", slug `aura-intercept`). Idempotent — safe to re-run; passwords are reset on each run.

## Plan

### 1. Promote the existing company row to Elite SaaS tenant
SQL migration on `companies` row `04c57cbe...`:
- `subscription_tier = 'command'` (Elite — unlocks all 24 agents)
- `industry_vertical = 'saas_platform'` *(new pack — see step 2)*
- Brand colors → cyber-sentry cyan/violet
- `public_app_url = https://auraintercept.ai`, `is_demo = false` (already set)
- Refresh `ai_voice_greeting` + `ai_agent_prompt` with Aura Intercept-specific copy ("Thanks for calling Aura Intercept, the AI receptionist platform for service businesses…")
- Set `contact_email = ai@auraintercept.ai`, `email = ai@auraintercept.ai`, address, dispatch_phone

### 2. Add a 19th industry pack: `saas_platform`
New row in `industry_template_packs` so all industry-aware UI surfaces resolve to SaaS-appropriate copy automatically (matches Industry Template Pack standard).

Pack contents:
- **Label**: "SaaS Platform"
- **Job templates / services**: Platform Demo, Onboarding Call, Technical Support, Billing Question, Integration Setup, Custom Quote, Strategy Review
- **Terminology overrides**: customer → "company", appointment → "demo call", technician → "solutions engineer", service area → "industries served"
- **KB seed docs (3)**: Platform Overview · Pricing & Tiers (Core $197 / Boost $497 / Pro $997 / Elite $1,997 + 90-day trial) · Integration Guide (SignalWire / ElevenLabs / Resend / Tavily bundled)
- **FAQs (8)**: trial length, what's in each tier, cancellation, white-label, data ownership, third-party fees disclosure, supported industries, onboarding timeline

The trigger `trg_seed_industry_pack_kb` fires automatically when `industry_vertical` flips to `saas_platform` — KB docs and FAQs land without extra code.

Add `'saas_platform'` to:
- `src/lib/industryNavLabels.ts`
- `src/lib/industryKpiLabels.ts`
- `src/lib/industryEmptyStates.ts`
- `src/lib/industryAuraFraming.ts`
- `src/lib/industryMarketingPlaybooks.ts`
- `src/lib/industryQuickActions.ts`

### 3. Create the 3 staff accounts
New edge function `seed-aura-intercept` (modeled on `seed-demo-accounts-v2`, `platform_admin` JWT-gated, idempotent). For each account:
- `auth.admin.createUser` (or password reset on re-run) with `email_confirm: true`
- Insert/update `profiles` with `company_id = 04c57cbe...`
- Upsert `user_roles` per the table above
- Upsert `employee_job_assignments` for support/sales personas

Password for all three: **`aiagent*!`** (per your instruction).

### 4. Seed real workspace state (this is your live workspace, not demo data)
- **Services**: Replace the 1 stub with 7 SaaS-specific service rows (Demo Call 30m, Onboarding 60m, Tech Support 30m, Integration Setup 60m, Custom Quote 30m, Strategy Review 45m, Billing Question 15m)
- **Business hours**: Replace existing 28 rows with Mon–Fri 9–18 (office hour_type)
- **Smart website**: Update existing row — Aura Intercept hero/about/contact copy, enable chat widget, voice widget, public booking widget; ensure subdomain published
- **AI operatives**: Activate the full Elite-tier agent set (24 agents) for this company
- **Tenant integrations**: Keep existing row; ensure `use_platform_tts = true` so voice works without a per-tenant ElevenLabs key
- **Clean inboxes**: Delete the 5 stub appointments + 1 stub lead so you start with empty real inboxes

### 5. Public contact surfaces (how prospect companies reach you)
Already exist platform-wide — just verified pointed at the new tenant:
- **Public booking page**: `/book/aura-intercept` → `submit_public_booking` RPC → drops into Aura Intercept's `leads` table
- **Embedded chat widget**: `/widget?company=aura-intercept` — paste-able snippet for the marketing site
- **Voice agent**: Wired through `dispatch_phone` + `ai_voice_greeting` + `ai_agent_prompt`; missed-call handler routes to Aura Intercept's queue
- **Customer portal**: `/portal/aura-intercept` — companies that sign up can view tickets, bookings, billing
- **Smart website**: Published at the configured subdomain so the marketing site can iframe / link the widgets

### 6. UI safety / role gating
- `useCompanyAdminDashboard` resolves the Elite-tier layout for `ai@auraintercept.ai`
- `auraintercept@gmail.com` keeps `platform_admin` only — no `company_id`, no role drift
- `/dashboard/demo-seeder` gets a new "Re-seed Aura Intercept Tenant" button next to the demo seeder for one-click reset (platform-admin gated)

### 7. Memory + docs
- New file `mem://platform-operations/aura-intercept-tenant.md` — company id, account emails, password, industry pack, re-seed entrypoint
- Add a one-liner to memory index Memories section
- Update existing `mem://auth/admin-identity` to clarify the split: `auraintercept@gmail.com` = platform_admin only; `ai@auraintercept.ai` = tenant company_admin

## Technical notes

```text
Files to add/edit:
  supabase/migrations/<ts>_aura_intercept_tenant.sql       company update + saas_platform pack row
  supabase/functions/seed-aura-intercept/index.ts          idempotent seeder (platform_admin gated)
  src/lib/industry*.ts (6 files)                            saas_platform branch in each
  src/pages/DemoAccountSeeder.tsx                          add "Seed Aura Intercept" button
  .lovable/memory/platform-operations/aura-intercept-tenant.md   new memory
  .lovable/memory/auth/admin-identity.md                    clarify split
  mem://index.md                                            add Memories entry

DB ops (in migration):
  - INSERT industry_template_packs row 'saas_platform' (with 3 docs + 8 FAQs in kb_seed_documents)
  - UPDATE companies SET industry_vertical='saas_platform', subscription_tier='command',
      ai_voice_greeting=..., ai_agent_prompt=..., contact_email='ai@auraintercept.ai', ...
      WHERE id='04c57cbe-358e-4036-a3ad-b777a55f5be0'
  - DELETE existing stub appointments/leads/services for that company
  - INSERT 7 services rows
  - REPLACE business_hours rows
  - UPDATE smart_websites + tenant_integrations rows

Seeder behavior:
  - Looks up company by id 04c57cbe...
  - For each of 3 emails: tries createUser → on duplicate, looks up id and resets password
  - Upserts profiles with company_id
  - Upserts user_roles (company_admin / employee / employee)
  - Upserts employee_job_assignments (technician for support; marketing+dispatch for sales)
  - Returns JSON summary of accounts created/updated
```

The `auth.users` table cannot be edited via SQL migration (security memory rule), so all user creation/password-reset goes through the edge function using the service-role admin client — same pattern as `seed-demo-accounts-v2`.

## Post-deploy steps you'll do

1. After deploy completes, navigate to `/dashboard/demo-seeder` (signed in as `auraintercept@gmail.com`)
2. Click **"Seed Aura Intercept Tenant"** — runs in ~10 seconds
3. Sign out, sign in as `ai@auraintercept.ai` / `aiagent*!` → land in the full Elite Aura Intercept console
4. Drop the chat widget snippet on `auraintercept.ai` → prospects start landing as leads in your console

Reply **approve** to build.
