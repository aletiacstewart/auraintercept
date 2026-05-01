# Industry-Aware Dashboards & Consoles

## The Problem

The Real Estate Elite demo loads the correct `industry_template_pack` (cluster `booking`, terminology `job→Showing`, `customer→Buyer/Seller`, widgets `showings_calendar / lead_scoring / listing_tracker / review_pulse / missed_calls`), but three surfaces ignore the pack and show hardcoded HVAC/trades copy:

1. **Aura Command Center hero** (`src/components/dashboard/AuraCommandCenter.tsx` + `src/locales/en/aura.json`) — hardcoded "Book today's emergency job", "spring tune-ups", "Check today's dispatch schedule", "overdue invoices".
2. **Business Management Console workflows** (`src/pages/ai-consoles/BusinessManagementConsole.tsx`) — hardcoded "Lead → Invoice", "Quote → Job", "Invoice Follow-Up" with technician language.
3. **Sidebar labels** (`src/components/dashboard/DashboardLayout.tsx`) — fixed "Technician View", "Dispatch View" regardless of cluster. For booking-cluster industries (real estate, salons, fitness, professional services) these labels are misleading.

The `IndustryWidgetGrid` component already pulls from the pack correctly — we just need to extend the same pattern to the surfaces above.

## What Will Change

### 1. New industry quick-actions registry
Create `src/lib/industryQuickActions.ts` exporting a map keyed by `cluster` (and overrideable per `industry_id`) returning 6 quick actions, each with: `key`, `icon`, `label`, `description`, `route`, `auraCommand`.

Examples:
- **trades** (HVAC/plumbing/electrical/roofing): keep current emergency/dispatch/tune-ups set.
- **booking** (real_estate, salon, fitness, professional): "Book a showing today", "Show new leads to follow up", "Generate listing social posts", "Today's appointment calendar", "Send a quote/proposal", "This week's revenue".
- **outdoor** (landscape, pool_spa, pest_control): "Today's recurring routes", "Weather-impacted stops", "Generate seasonal campaign", "Open route map", "Quote a new property", "Week revenue".
- **repair** (auto_care, appliance_repair, mobile_mechanic): "Today's repair queue", "Parts orders pending", "Generate repair tip post", "Open dispatch", "Quote a new ticket", "Week revenue".

Per-industry overrides for real_estate, auto_care, salon, etc. so wording matches terminology (Showing vs Job, Buyer vs Customer).

### 2. Wire AuraCommandCenter to the pack
- Call `useIndustryPack()` in `AuraCommandCenter.tsx`.
- Resolve quick actions via `getIndustryQuickActions(pack)` → render labels/descriptions directly (no i18n key lookup), keep i18n strings only for `command.heading`, `command.placeholder`, `suggestions.sectionTitle`, `suggestions.sectionHint`.
- Remove the now-unused `bookEmergency*`, `generatePosts*`, etc. keys from `aura.json` (en + es).

### 3. Industry-aware Business Management workflows
- In `BusinessManagementConsole.tsx`, replace the hardcoded `BUSINESS_WORKFLOWS` constant with a `useMemo` that calls a new helper `getBusinessWorkflows(pack)`.
- Define cluster-specific workflow chains in `src/lib/industryWorkflows.ts`:
  - **booking**: "Lead → Showing → Offer", "Listing → Marketing → Open House", "Invoice/Commission Follow-Up".
  - **trades**: current set (Lead→Invoice, Quote→Job, Invoice Follow-Up).
  - **outdoor**: "Route → Service → Invoice", "Quote → Recurring Plan", "Seasonal Campaign".
  - **repair**: "Intake → Diagnose → Quote", "Parts Order → Repair → Invoice", "Customer Update Loop".
- Use pack `terminology` for substitutions (`{{job}}`, `{{customer}}`, `{{appointment}}`).

### 4. Cluster-aware sidebar labels
- In `DashboardLayout.tsx`, call `useIndustryPack()` and remap labels based on `pack.cluster` + `pack.terminology`:
  - **trades / outdoor / repair** → "Technician View" / "Dispatch View" (current).
  - **booking** → "Agent View" / "Schedule View" (real estate: "Agent View"/"Listings Map"; salon: "Stylist View"/"Chair Schedule").
- Centralize the mapping in `src/lib/industryNavLabels.ts` so we can tune per-industry without editing the layout.

### 5. Verification
- Sign in as `realestate-elite@aidemo.test` (Real Estate Elite demo) — hero should now show "Book a showing today / new lead follow-ups / generate listing posts / today's calendar / send proposal / week revenue", Business Mgmt Console should show "Lead → Showing → Offer", sidebar should read "Agent View".
- Sign in as `hvac-elite@aidemo.test` — surfaces unchanged from today.
- Smoke-test plumbing-pro, landscape-boost, auto-care-elite, salon-pro to confirm cluster fallbacks render and routes still resolve.

## Technical Details

**Files to create**
- `src/lib/industryQuickActions.ts` — cluster + industry override map, `getIndustryQuickActions(pack)` resolver.
- `src/lib/industryWorkflows.ts` — cluster + industry override map, `getBusinessWorkflows(pack)` resolver.
- `src/lib/industryNavLabels.ts` — `getNavLabels(pack)` returning `{ techView, dispatchView }`.

**Files to edit**
- `src/components/dashboard/AuraCommandCenter.tsx` — consume `useIndustryPack`, render from resolver.
- `src/pages/ai-consoles/BusinessManagementConsole.tsx` — consume `useIndustryPack`, build workflows via `useMemo`.
- `src/components/dashboard/DashboardLayout.tsx` — consume `useIndustryPack`, swap "Technician View" / "Dispatch View" labels.
- `src/locales/en/aura.json`, `src/locales/es/aura.json` — drop the dead `suggestions.book*/overdue*/generate*/check*/createQuote/weekRevenue` keys.

**Out of scope (kept as-is)**
- `IndustryWidgetGrid.tsx` already industry-aware — no change.
- `ai-agent-chat` industry deltas already in place via `industry-pack-prompt-delta-aliases` memory — no change.
- Console headers, page titles, terminology in other CRUD pages — can follow as a phase 2 once this hero/workflow/sidebar pass is approved.

## Result

Real Estate Elite (and every other booking-cluster company) gets a dashboard that talks about showings, listings, buyers, and proposals instead of emergency HVAC jobs and overdue invoices, while trades-cluster companies see no regression. The pattern is data-driven via `industry_template_packs`, so adding more industries later only requires DB rows + optional override entries — no component edits.
