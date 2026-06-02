## Issues confirmed

1. **AI Generate error in Create Campaign** — Edge function log shows `ReferenceError: supabase is not defined` at `generate-campaign-content/index.ts:133`. The `supabase` client is declared inside `if (companyId) { ... }`, but it's referenced again later (line 179) by `loadIndustryPackForCompany(supabase, companyId)` outside that block. Any request with a `companyId` crashes after Tavily research.

2. **Campaigns aren't sent anywhere** — `CampaignForm` correctly inserts into `marketing_campaigns` with `status: 'draft'`, but `/dashboard/campaigns` only lists them with metrics; there is **no Launch / Send action**, no dispatch edge function. So users build a campaign and it never goes out.

3. **"Demo Calls" sidebar label** — `src/lib/industryNavLabels.ts` maps `saas_platform.appointments.title = 'Demo Calls'`. Aura Intercept runs on the `saas_platform` pack, so the Customers > Calendar entry shows "Demo Calls".

4. **OPERATIONS > "Appointment" link** — In `DashboardLayout.tsx`, the second Field-Ops nav item (`/dashboard/dispatch-field-ops`) is relabeled "Appointment Console" when `operatingModel === 'appointment_booking'` (Aura Intercept's model). User wants this to be a **Video Console** for live video meetings, but only for the Aura Intercept (`saas_platform`) tenant.

## Plan

### 1. Fix AI Generate (edge function)
File: `supabase/functions/generate-campaign-content/index.ts`
- Hoist the `supabase` client creation above the `if (companyId)` block so the reference on line 179 resolves. Guard the inner DB calls behind the `companyId` check as today.

### 2. Add "Send Campaign" capability
- **New edge function** `supabase/functions/send-campaign/index.ts`:
  - Input: `{ campaignId }`.
  - Loads campaign + company, resolves recipients from the `target_segment`:
    - `all` → distinct customers from `customers` table.
    - `inactive` → customers with no `appointments` in last `inactivePeriod` days (default 90).
    - `new` → customers created in last 30 days.
    - `vip` → customers with most appointments (top decile).
  - For each `channels` entry:
    - `email` → call existing `send-email-guarded` with `email_subject` + rendered `message_template` (replace `{customer_name}`, `{promo_code}`, `{discount}`).
    - `sms` → call existing `send-appointment-sms`-style SignalWire path with rendered template.
  - Updates `marketing_campaigns`: `status='active'`, `total_sent` increment, `last_sent_at = now()`.
  - Logs per-recipient delivery to a `campaign_sends` table (new migration; tracks `campaign_id`, `customer_id`, `channel`, `status`, `sent_at`, `error`).
- **UI** in `src/pages/Campaigns.tsx`:
  - Add a **"Send Now"** button on each draft campaign card (and a "Resend"/"Send Again" on active ones).
  - Confirm dialog showing estimated recipient count + channels + 3rd-party cost disclaimer (per project policy).
  - Calls the new edge function and refreshes the list.

### 3. Rename "Demo Calls" → "Appointments"
File: `src/lib/industryNavLabels.ts`
- `saas_platform.appointments.title = 'Appointments'` (description updated to: "Customer appointments, demos, onboarding, and strategy sessions").

### 4. Aura Intercept Operations link → Video Console
- **New page** `src/pages/VideoConsole.tsx`: live video meeting console (using existing meeting/Jitsi infra if present, otherwise a placeholder card with "Start meeting" / "Join meeting" / upcoming list pulled from `appointments` where `meeting_type='video'`). Scoped to platform_admin/company_admin of Aura Intercept tenant.
- **Route**: register `/dashboard/video-console` in the router (gated to `saas_platform` industry pack only).
- **`DashboardLayout.tsx`**: when `industryPack?.industry_id === 'saas_platform'`, override the `/dashboard/dispatch-field-ops` item to `{ href: '/dashboard/video-console', label: 'Video Console', icon: Video }`. All other industries keep current behavior (Appointment Console / Dispatch View / etc.).

### Out of scope
- Changing the Customers > Calendar route target (only its label).
- Reworking `marketing_campaigns` schema beyond adding `campaign_sends` + `last_sent_at`.
- Pricing / tier gating changes for video meetings (assume bundled with existing Aura Intercept tenant).

### Files touched
- `supabase/functions/generate-campaign-content/index.ts` (hoist supabase client)
- `supabase/functions/send-campaign/index.ts` (new)
- `supabase/migrations/*_campaign_sends.sql` (new table + grants + RLS)
- `src/pages/Campaigns.tsx` (Send Now button + confirm dialog)
- `src/lib/industryNavLabels.ts` (Demo Calls → Appointments)
- `src/pages/VideoConsole.tsx` (new)
- `src/App.tsx` (or router file) — register `/dashboard/video-console`
- `src/components/dashboard/DashboardLayout.tsx` (Aura-Intercept-only override)
