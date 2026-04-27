# Dynamic Demo Page — Industry-Driven 48hr Demo

Make `/for-business` an unmistakable **"Dynamic Demo Page for Aura Intercept"** with a single **"I am a…"** dropdown containing every industry from the homepage. Selecting an industry rewrites the page content **and** the demo company that gets provisioned, with real seeded data (appointment, lead, customer, services, hours) and clear notices on anything that requires 3rd-party integrations.

---

## 1. Page header rework (`src/pages/ForBusiness.tsx`)

Replace the current chip-row selector with a clear demo header:

```text
┌──────────────────────────────────────────────────────────────┐
│ DYNAMIC DEMO PAGE · Aura Intercept                           │
│ Pick your industry → see your demo · 48 hr full access       │
│                                                              │
│ I am a:  [ HVAC ▼ ]   [ Start 48hr Demo → ]                  │
└──────────────────────────────────────────────────────────────┘
```

- Add a "DYNAMIC DEMO PAGE" eyebrow chip + supporting line above the dropdown.
- Replace `IndustrySelector` (horizontal chips, only 6 industries) with a new `IndustryDropdownPicker` using shadcn `Select` — sticky under the header, full-width on mobile, max-width 360px on desktop.
- Keep deep-linking (`?industry=hvac`) and `localStorage` persistence.
- Show a small "Live preview updating…" pulse next to the hero when the selection changes.

## 2. Expand industries to match the homepage (20 total)

Rewrite `src/lib/industryMarketingContent.ts` so `INDUSTRY_CONTENT` covers every entry from `Index.tsx → industryCategories`, grouped for the dropdown:

- **Essential Trades**: HVAC, Plumbing, Electrical, Solar Energy
- **Exterior & Structural**: Roofing, Fencing & Decking
- **Property & Estate**: Landscape & Trees, Pool & Spa, Pest Control
- **Specialized Home**: Appliance Repair, Handyman & Cleaning, Construction
- **Mobile & Commercial**: Auto Care, Security Systems, Real Estate
- **Wellness & Personal**: Beauty & Wellness, Restaurants, Personal Assistant
- **Other** (catch-all)

Each entry keeps the existing shape — `hero`, `painPoints`, `sampleCalls`, `sampleServices` — plus two new fields used by the demo seeder:

- `sampleAppointment`: `{ customerName, service, whenOffsetHours, address, notes }`
- `sampleLead`: `{ name, source, intent, serviceInterest, priority, score }`
- `serviceArea`: `{ cities, zips }` (so e.g. Pool & Spa seeds Phoenix, not Austin)
- `colors`: `{ primary, secondary }` (so the demo company branding flips per industry)

The dropdown groups items using `SelectGroup` + `SelectLabel` so the user sees the same 6 categories as the homepage.

## 3. Industry-specific demo seeding

Update `supabase/functions/create-demo-trial/index.ts` so the seeded demo company reflects whichever industry was picked — not a generic Austin HVAC shop.

Replace the small in-function `INDUSTRY_DEFAULTS` map with a full table covering all 20 industries. For each industry the function will:

1. **Company**: name = `<Industry> Demo Co.`, `industry_vertical`, `service_categories`, `service_area_cities`, `service_area_zip_codes`, `primary_color/secondary_color` from the industry config.
2. **Business hours**: weekday/weekend hours from `BUSINESS_TEMPLATES` where defined, else 8–5 weekdays / closed.
3. **Customers**: 4 sample `customer_profiles` with industry-appropriate addresses, plus the demo `Sample Customer` user.
4. **Appointments** (6 total, mix of statuses):
   - 1 **scheduled tomorrow** for the demo customer (uses `sampleAppointment`)
   - 2 more `scheduled` in next 7 days
   - 2 `completed` in last 10 days
   - 1 `cancelled`
   All `service_type` values come from `sampleServices`.
5. **Leads**: 3 leads using `sampleLead` + 2 randomized variants.
6. **SMS keywords**: seed 2 industry-relevant hashtag responders (e.g. `#emergency`, `#quote`) via `sms_keywords` if the table exists — wrapped in try/catch so missing optional tables don't break trial creation.
7. **Knowledge base entry**: a single seed FAQ tailored to industry ("What does an emergency AC call cost?" etc.) so the AI has something real to retrieve in the demo.

Trial-record + 3 user creation (admin / employee / customer) and the existing 7-day rate-limit stay as-is.

## 4. "Real vs requires-integration" transparency

Add a new `IntegrationStatusPanel` to the demo page (between `RolePreviewRow` and pricing) plus a banner inside the **post-demo credentials card**. Each row shows: feature, status, and what the demo will do.

| Feature                       | Demo behavior                                                                 |
|-------------------------------|-------------------------------------------------------------------------------|
| Dashboard, agents, jobs, leads, customers, analytics | **Live** — backed by real DB writes in your demo company.            |
| Aura chat (Message Aura)      | **Live** — Lovable AI gateway; works end-to-end.                              |
| AI image generation           | **Live** — `google/gemini-2.5-flash-image`.                                   |
| Voice (Talk to Aura, inbound calls)   | **Mock demo** — pre-recorded transcript + simulated call log. Real voice needs SignalWire + ElevenLabs. |
| Outbound SMS / SMS auto-responder | **Mock demo** — sends in-app log entry only. Real SMS needs SignalWire 10DLC. |
| Outbound email                | **Live** if Resend is configured; otherwise **mock demo** (in-app log).       |
| Google Calendar sync          | **Mock demo** — seeded events shown as if synced. Real sync needs Google OAuth. |
| Stripe billing / invoices     | **Mock demo** — invoice records inserted, no card processed.                  |
| Social posting                | **Mock demo** — content saved as drafts; real publish needs Meta/LinkedIn/etc. OAuth. |

Implementation:

- New component `src/components/marketing/IntegrationStatusPanel.tsx` renders the table from a shared `DEMO_FEATURE_STATUS` constant.
- The same constant powers a small **"Demo mode" badge** on the existing `DemoExpiryBanner` that, when clicked, opens a modal listing which features are live vs mocked.
- Inside affected consoles during a demo session, show an inline `Alert` ("This is a mock demo — real <X> needs <Y> integration") above the relevant action button. Detection uses the existing `useDemoSession` hook (`isDemo` flag).

## 5. Mock demos for 3rd-party-gated features

For demo users only (gated by `useDemoSession().isDemo`), add lightweight mock paths so they can "feel" the feature without 3rd-party wiring:

- **Inbound voice call**: in the Aura Command Center, a "Play sample call" button plays a canned transcript and inserts a simulated `call_logs` row tagged `is_demo=true`.
- **Outbound SMS**: "Send sample SMS" inserts a `sms_logs` row with status `mock_sent` and surfaces it in the SMS Logs page with a "Demo" badge.
- **Calendar sync**: pre-seed 3 events into `appointments` with `source='google_calendar_demo'` so the calendar view looks populated.
- **Stripe checkout**: clicking checkout in demo mode opens a "This would launch Stripe Checkout" modal instead of hitting Stripe.

All mock-write paths set `is_demo=true` (already cleaned up by `expire-demo-trials`).

## 6. UX polish

- The CTA buttons (`IndustryHero`, final CTA section, RolePreviewRow's "Try this view") all read the current dropdown industry so the dialog opens with it pre-selected.
- `StartDemoDialog` shows a one-line "Your demo will be a **<industry>** shop in **<city>** with **<X>** seeded jobs" preview before the user submits.
- After provisioning, the `DemoCredentialsCard` shows an "Industry: <label>" chip and a one-tap "What's mocked vs live?" link to the integration status modal.

---

## Files

**Modified**
- `src/pages/ForBusiness.tsx` — header rework, dropdown wiring, integration panel.
- `src/lib/industryMarketingContent.ts` — expand to all 20 industries, add new fields.
- `src/components/marketing/IndustryHero.tsx` — minor copy tweak ("Demo for <Industry>").
- `src/components/marketing/StartDemoDialog.tsx` — preview line + pre-selected industry.
- `src/components/marketing/DemoCredentialsCard.tsx` — industry chip + mock-vs-live link.
- `src/components/common/DemoExpiryBanner.tsx` — "Demo mode" details modal.
- `supabase/functions/create-demo-trial/index.ts` — full per-industry seeding.

**Created**
- `src/components/marketing/IndustryDropdownPicker.tsx` — grouped shadcn `Select`.
- `src/components/marketing/IntegrationStatusPanel.tsx` — live-vs-mock table.
- `src/lib/demoFeatureStatus.ts` — single source of truth for feature status rows.
- `src/components/common/DemoMockBadge.tsx` — small inline badge consoles can drop in.

**Removed/unused**
- `src/components/marketing/IndustrySelector.tsx` — replaced by the dropdown.

No new database migrations are required; everything uses existing tables (`companies`, `appointments`, `leads`, `customer_profiles`, `business_hours`, `call_logs`, `sms_logs`, `demo_trials`).
