# Remove all demo-seeded content

Goal: the only "60-Day Live Demo" a company ever gets is the real signup flow in `SignUp.tsx` — a real, empty tenant they populate with their own data. Every code path that pre-populates a tenant with fake customers, jobs, invoices, or "Demo Construction/HVAC/Electrical/Landscape/Home Health Care" companies is deleted.

## Scope split

Two distinct fake-data systems currently exist. Both are removed:

1. **Sandbox 60-day demo tenants** — spun up by the marketing voice agent / avatar chat via `send_walkthrough_demo` client tool → `send-walkthrough-demo` → `create-demo-trial`, then delivered via `/demo/:trialId` (`DemoAccess.tsx`) with a shared password. Expired daily by `expire-demo-trials`.
2. **Platform-admin fake tenant registry** — `Demo Construction`, `Demo HVAC`, `Demo Electrical`, `Demo Landscape & Trees`, `Demo Home Health Care`, etc. Created by `seed-demo-accounts-v2` from the `DemoAccountSeeder` page at `/dashboard/demo-seeder`, wiped by `wipe-demo-companies`. These are the "$378.88 identical rows" from the last audit.

Real customer signup (`/signup` → `SignUp.tsx`, `is_demo: false`, Stripe subscription, 60-day trial) is untouched.

## Step 1 — Wipe existing seeded data (one-time)

Before schema/code removal, invoke the existing `wipe-demo-companies` edge function once to hard-delete every `companies.is_demo = true` row and all cascaded child rows + associated auth users. This is safer than doing it inside the migration because it removes `auth.users` rows too.

Fallback if the function fails: run a data-only script that deletes from `companies WHERE is_demo = true` (cascades handle most children).

## Step 2 — DB migration

Single migration that:
- `DROP TABLE public.demo_trials CASCADE;`
- `DROP FUNCTION IF EXISTS public.get_demo_trial_access(uuid);` (and any sibling demo RPCs surfaced by `\df public.*demo*`)
- Removes any RLS policies / grants referencing `demo_trials`
- `ALTER TABLE public.companies DROP COLUMN IF EXISTS is_demo;`
- Drops `NewSignupsWidget`-style indexes on `is_demo` if any

Verification query included in the migration description: `SELECT COUNT(*) FROM companies WHERE name ILIKE 'Demo %'` should return 0 after Step 1.

## Step 3 — Delete edge functions

Delete via `supabase--delete_edge_functions`:
- `create-demo-trial`
- `expire-demo-trials`
- `send-walkthrough-demo`
- `seed-demo-accounts-v2`
- `wipe-demo-companies`

## Step 4 — Frontend removals

Delete files:
- `src/pages/DemoAccountSeeder.tsx`
- `src/pages/DemoAccess.tsx`
- `src/components/marketing/DemoCredentialsCard.tsx`
- `src/components/admin/ElevenLabsToolChecklist.tsx` (only registers `send_walkthrough_demo`)

Update:
- `src/App.tsx` — remove `DemoAccountSeeder` + `DemoAccess` imports and the `/dashboard/demo-seeder` and `/demo/:trialId` routes.
- `src/components/dashboard/DashboardLayout.tsx` — remove the "Demo Account Seeder" nav entry.
- `src/pages/SuperSwitcher.tsx` — drop the seed-demo button, the demo-seeder link, and the `.eq('is_demo', true)` query. If the page's only purpose was toggling demo tenants, remove the page entirely and its route + all nav references. (Confirm with a quick read; likely just prune the demo bits and keep the industry switcher.)
- `src/components/dashboard/NewSignupsWidget.tsx` — drop `.eq('is_demo', false)` and the `is_demo` column selection.
- `src/components/ai/CompanySelector.tsx` — drop the `is_demo` badge + interface field.
- `src/components/aura/AuraAvatarChat.tsx` and `src/components/ai/VoiceChat.tsx` — remove the `send_walkthrough_demo` client-tool implementation. Voice/avatar can still capture the lead (name/email/phone) via existing `create_lead` / contact-form paths; they just no longer spin up a sandbox tenant. Replace the tool's spoken response with a plain "I've forwarded your details to the sales team — they'll follow up shortly."
- `src/lib/auraInterceptSalesPrompt.ts` — remove the `send_walkthrough_demo` tool reference; keep lead-capture guidance. Change CTA line from "send a walkthrough" to "book a 15-minute call or start the trial."
- `src/pages/Contact.tsx` L408 — reword "one-tap link to a live walkthrough demo pre-loaded for your business" → "we'll follow up to schedule a personalized walkthrough of Aura."
- `src/pages/integrations/VoiceIntegration.tsx` L230 — drop the ElevenLabs `send_walkthrough_demo` checklist section.
- `supabase/functions/voice-swaig/index.ts` L369-377 — remove the `send-walkthrough-demo` forward; keep the lead-capture branch.
- `supabase/functions/notify-platform-on-signup/index.ts` — drop `is_demo` select and the `if (company.is_demo)` short-circuit.
- `supabase/functions/check-subscription/index.ts` L206-220 — drop `is_demo` select and the demo-tenant free-pass branch (any tenant left must go through real subscription logic now).
- `supabase/functions/ai-agent-chat/index.ts` L7637 — remove the `send-walkthrough-demo` invoke (or gate behind a feature flag disabled by default; simpler to remove).

## Step 5 — Regenerate types + smoke test

- Types file regenerates automatically after migration approval; verify `demo_trials` and `is_demo` no longer appear.
- `tsgo` clean.
- Manual verification: `/dashboard/demo-seeder` returns 404; `/demo/anything` returns 404; SuperSwitcher no longer lists demo companies; Platform Dashboard Company Breakdown shows only real tenants; `SignUp.tsx` still creates an empty tenant successfully.
- Update `mem://platform-operations/demo-account-registry` to note the demo-seeding system was removed on this date and any future "demo" is the real 60-day trial only.

## Out of scope (kept intact)

- `SignUp.tsx` and everything downstream — real 60-Day Live Trial for paying tenants.
- `seed-super-admin`, `seed-aura-intercept`, `seed-sales-rep-accounts` — internal bootstrap for the Aura Intercept tenant + super-admin identity, not customer-facing fake data.
- `beta_invite_codes` — real program, not seeded demo data.
- `industry_template_packs` — data-driven per-industry config; contains no fake customer/appointment/invoice rows.
- Marketing copy that says "60-Day Live Trial" or "60-Day Live Demo" — kept, meaning changes from "sandbox with sample data" to "your real workspace, day one."

## Technical notes

- Files touched (est.): 4 file deletions, ~12 file edits, 1 migration, 5 edge-function deletions.
- Risk: `check-subscription` currently gives `is_demo=true` tenants a free pass. After Step 1 there are no such rows, so removing the branch is safe.
- No user data is at risk — every deletion is scoped to `is_demo = true` or child rows of same.
