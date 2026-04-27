## Plan: Industry-Targeted Marketing Page + 48-Hour Demo Access

### Goal
A public, shareable marketing page (`/for-business`) that adapts its messaging to the visitor's selected industry, plus a one-click "Try It Free for 48 Hours" flow that grants the prospect temporary login access to a fully-loaded demo company so they can experience the **admin dashboard**, **employee/technician console**, and **customer portal** end-to-end.

This is what links inside SMS/email outreach will point to.

---

### Part 1 — Public marketing page `/for-business`

A single dynamic page with these sections:

1. **Hero**
   - Headline + subheadline that re-render based on selected industry
   - Two CTAs: "Try the demo (48 hrs free)" and "Book a walkthrough"

2. **Industry Type Selector** (sticky chip bar, top of page)
   - Reuses `BUSINESS_TEMPLATES` from `BusinessTypeSelector` (HVAC, Plumbing, Electrical, General Contractor, Landscaping, Other)
   - Selected industry persists to `localStorage` and updates the URL (`?industry=hvac`) so SMS/email links can deep-link, e.g. `auraintercept.ai/for-business?industry=plumbing`

3. **"What Aura does for {Industry}" section** (dynamic per industry)
   - 3-column value cards mapped to that industry's pain points (e.g. HVAC → "Never miss an after-hours emergency call", Landscaping → "Auto-quote seasonal cleanups")
   - Quick "day in the life" timeline: Call → Aura answers → Books job → Dispatches tech → Sends invoice

4. **Live preview row**
   - Three labeled tiles: **Owner Dashboard**, **Technician App**, **Customer Portal**
   - Each tile shows a screenshot/preview and a "Try this view" button that launches into the demo logged in as that role

5. **Pricing snapshot** (4-tier card row from canonical pricing)

6. **CTA footer** — "Start your 48-hour demo" + "Talk to a human"

**Files**
- Create `src/pages/ForBusiness.tsx`
- Create `src/components/marketing/IndustryHero.tsx` (industry-aware hero copy)
- Create `src/components/marketing/IndustryValueProps.tsx` (per-industry pain-point cards)
- Create `src/components/marketing/RolePreviewRow.tsx` (3 tiles → demo)
- Create `src/lib/industryMarketingContent.ts` (single source of truth: per-industry headline, subheadline, pain points, sample calls, CTAs)
- Add route in `src/App.tsx`: `/for-business` (public, wrapped in `PublicHeader` + `PublicFooter`)

---

### Part 2 — 48-hour temporary demo access

A frictionless "kick the tires" flow. The prospect enters their **email + business name + industry** and we instantly issue them three time-boxed login credentials (admin / employee / customer) tied to a freshly-cloned demo company for that industry.

**Flow**
1. User clicks "Try the demo" on `/for-business`
2. Modal opens → email, business name, industry (pre-filled from selector), phone (optional, for SMS opt-in to receive demo links)
3. Backend provisions a **temporary demo tenant** valid for 48 hours
4. Returns three sets of credentials shown on-screen + emailed (and SMS'd if opted in):
   - `demo-admin-{token}@auraintercept.ai`
   - `demo-tech-{token}@auraintercept.ai`
   - `demo-customer-{token}@auraintercept.ai`
   - Universal password: `auratrial*!`
5. Big "Open Owner View" / "Open Tech View" / "Open Customer View" buttons that one-click sign them in

**Auto-cleanup**: A cron job runs hourly to delete expired demo tenants (company + users + data).

---

### Technical Details

#### New table: `demo_trials`
```
id uuid pk
company_id uuid (the cloned demo company)
prospect_email text
prospect_name text
prospect_phone text (nullable)
industry text
admin_user_id uuid
employee_user_id uuid
customer_user_id uuid
created_at timestamptz default now()
expires_at timestamptz (now() + 48 hrs)
status text default 'active'  -- active | expired | extended
sms_opt_in bool default false
```

RLS: only platform_admin can SELECT. Public RPC `create_demo_trial(...)` (SECURITY DEFINER, rate-limited per email/IP).

#### New edge function: `create-demo-trial`
- `verify_jwt = false` (public)
- Input: `{ email, name, phone?, industry, sms_opt_in }`
- Rate limit: 1 trial per email per 7 days; 3 trials per IP per day
- Steps:
  1. Clone the appropriate `Demo {Industry}` template company (services, hours, sample appointments, sample customers, sample inventory, sample knowledge base entries)
  2. Create 3 auth users with `aura_demo_expires_at` metadata
  3. Assign roles (`company_admin`, `employee` w/ technician job type, `customer` associated to the company)
  4. Insert `demo_trials` row
  5. Send email via `resend-webhook`-style call with all three logins
  6. If `sms_opt_in`, store consent (`aura_sms_opt_in=true`) and SMS the admin login link
  7. Return credentials to client

#### New edge function: `expire-demo-trials` (cron, hourly)
- Find rows where `expires_at < now()` and `status='active'`
- Delete the company cascade (cleans appointments, customers, etc.)
- Delete the 3 auth users via service role
- Mark row `status='expired'`

#### Middleware addition
- Extend `ProtectedRoute` (and customer portal guards) to check `user.user_metadata.aura_demo_expires_at`. If expired → sign out + redirect to `/for-business?expired=1` with a "Your demo ended — start a paid plan" message.
- Add a global yellow banner inside dashboard/customer portal when logged in as a demo user: `"Demo expires in 41h 23m — upgrade to keep your data"` with a CTA to `/auth?mode=signup`.

#### Industry content seeding
For each industry template (HVAC, Plumbing, Electrical, General Contractor, Landscaping, Other), the cloned demo company gets pre-seeded:
- 5 sample customers with realistic names/addresses
- 8 sample appointments (mix of past/upcoming)
- 4 sample inventory items
- 3 sample SMS keywords (e.g. HVAC: `#emergency`, `#tuneup`, `#estimate`)
- 1 sample blog post
- Knowledge base seeded with industry-vertical Q&A from `industryMarketingContent.ts`

This makes the demo feel "alive" the moment the prospect logs in.

---

### Files summary

**Create**
- `src/pages/ForBusiness.tsx`
- `src/components/marketing/IndustryHero.tsx`
- `src/components/marketing/IndustryValueProps.tsx`
- `src/components/marketing/RolePreviewRow.tsx`
- `src/components/marketing/StartDemoDialog.tsx` (the 48h trial modal)
- `src/components/marketing/DemoCredentialsCard.tsx` (post-success view with 3 role buttons)
- `src/components/common/DemoExpiryBanner.tsx`
- `src/lib/industryMarketingContent.ts`
- `src/hooks/useDemoSession.ts` (detects demo user + countdown)
- `supabase/functions/create-demo-trial/index.ts`
- `supabase/functions/expire-demo-trials/index.ts`
- Migration: `demo_trials` table + RLS + `create_demo_trial` RPC + cron schedule (hourly)

**Edit**
- `src/App.tsx` — add `/for-business` public route + demo expiry guard
- `src/components/auth/ProtectedRoute.tsx` — check demo expiry metadata
- `src/components/dashboard/DashboardLayout.tsx` — show `DemoExpiryBanner` for demo users
- `src/pages/CustomerCompanyPortal.tsx` — same banner
- `src/components/layout/PublicHeader.tsx` — add "For Business" nav link

---

### Out of scope (can add later)
- Allowing demo users to *extend* their trial themselves (currently platform_admin only)
- Per-industry custom screenshots (we'll use the same dashboard previews and update copy only)
- A/B testing different headlines per industry
- Tracking conversion from demo → paid (basic `prospect_email` capture only for v1)

### Acceptance checks
1. Visit `/for-business?industry=plumbing` → hero, value props, and sample calls all read "plumbing"-specific
2. Click "Try the demo" → modal → submit → see 3 credentials + receive email
3. Click "Open Owner View" → logged into a fresh demo HVAC/Plumbing/etc. company with sample data
4. Yellow banner shows "Demo expires in 47h 58m"
5. After 48 hours, login fails and user is redirected to `/for-business?expired=1`
6. Cron job deletes the demo company + users; `demo_trials` row marked `expired`
