## Goal

Make every plan, console, dashboard, sidebar, demo account, and future paid signup line up with the canonical 4-tier × 18-industry matrix — not just the spots already flagged. Personal Assistant (Core) and Restaurants (Core) are the obvious failures, but the same root causes affect every tier and every industry, so the fix has to be system-wide.

## Root causes (verified in code + DB)

1. Two parallel sources of truth for "what is in each tier":
   - `src/lib/subscriptionAgentConfig.ts` (legacy 24-agent IDs: triage/booking/followup/review/lead/marketing/...).
   - `src/hooks/useAIAgentOrchestrator.ts` + `AIAgentsHub` UI (10-operative IDs: triage/customer_journey/outreach/creative_content/web_presence/...).
   They drift, so `customer_journey` and `outreach` show "Locked" on Aura Core even though the underlying booking/followup/review/lead/marketing rows are enabled in `ai_agent_configs`.

2. `AIAgentsHub` hides the entire `marketing_sales` category from `company_admin`, so Outreach Agent (a Core operative per the canonical registry) is invisible to every paid customer.

3. `DashboardLayout` sidebar gates `Customer Portal Console` and `Customer Website App` at Aura Boost (`connect`) — the canonical registry says these are Aura Core. There is also no plain "Schedule / Bookings" entry for company admins, so Core booking-only verticals (Personal Assistant, Beauty, Real Estate, Restaurants) appear to have no scheduler at all.

4. The "Core Agents" recommended set in `AIAgentsHub` is `triage, customer_journey, dispatch, business_finance` — Dispatch and Business Finance are Boost+/Pro+ operatives and don't belong in Core.

5. `seed-demo-accounts-v2` and `initialize-company-agents` seed a mix of consolidated + legacy IDs but don't normalize on read, and they don't enforce that booking-only Core verticals get the right industry-pack `extra_operatives` (`task_triager`, `calendar_optimizer`, `review_responder`, `menu_writer`, `reservation_optimizer`, `listing_writer`, etc.).

6. Dashboard widgets (`IndustryWidgetGrid`, KPI tiles) and console gating (`FeatureGate`) all read through these same broken paths, so the visible dashboards for booking-mode industries show field-ops vocabulary or empty Core surfaces.

7. The trial banner says "full access to all agents" — violates the rule that trial honors the selected tier.

## What I will fix (system-wide, not per-account)

### A. Single canonical tier → operative map

Rewrite `src/lib/subscriptionAgentConfig.ts` so the canonical IDs are the 10 consolidated operatives, and legacy IDs are kept only as input aliases:

- Core (`starter`): `triage, customer_journey, outreach, creative_content, web_presence`
- Boost (`connect`): Core + `dispatch, field_navigation`
- Pro (`performance`): Boost + `business_finance, analytics_intelligence, admin`
- Elite (`command`): all 10 operatives + all specialists allowed

Update `tierIncludesAgent`, `getRequiredTierForAgent`, `canAccessAgent`, `getAvailableAgents`, `getUpgradeTierForAgent`, and `LEGACY_AGENT_MAP` so any of `booking/followup/review/lead/marketing/route/eta/checkin/quoting/invoice/inventory/campaign/insights/forecast/social_scheduler/social_analytics` normalize to a consolidated operative before tier checks.

Result: every paid plan unlocks the operatives the marketing matrix promises, regardless of whether DB rows use legacy or consolidated IDs.

### B. AI Operatives Hub: correct Core set, no hidden categories

In `src/pages/AIAgentsHub.tsx`:
- Change `CORE_AGENT_TYPES` to `triage, customer_journey, outreach, creative_content, web_presence`.
- Remove `HIDDEN_CATEGORIES_FOR_NON_PLATFORM_ADMIN` for `marketing_sales` so Outreach Agent is visible to company admins.
- Update `handleEnableRecommended` and the "Enable Core Agents" CTA to enable the correct Core operatives (and their legacy aliases) rather than Dispatch/Business Finance.
- Replace the "trial mode with full access to all agents" alert with "Trial mode on your Aura Core/Boost/Pro/Elite plan — see what your selected tier includes." (per `mem://architecture/trial-honors-selected-tier`).
- Use canonical category labels: Customer Portal Console, Field Operations Console, Business Management Console, Outreach & Sales Console, Social Media Console, Creative & Web Presence Console, Analytics & Reports Console.

### C. Sidebar and routing — Core actually gets a Customer Console + Schedule

In `src/components/dashboard/DashboardLayout.tsx`:
- Move `Customer Portal Console` and `Customer Website App` from `requiredTier: connect` to `requiredTier: starter`.
- Add a company-admin "Schedule" / industry-aware label (Bookings/Reservations/Showings/Tasks) item linking to `/dashboard/appointments` for all paid tiers — so Personal Assistant, Beauty, Restaurants, Real Estate (all Core) actually see a scheduler.
- Keep `Field Ops` group at `performance` and keep the booking-mode hide for `field-ops/dispatch` (Personal Assistant, Beauty, Real Estate, Restaurants stay clean).
- Keep `Outreach & Sales`, `Social Media`, `Website` available at Core (they are part of Core in the canonical matrix).
- Audit `FeatureGate requiredConsole="customer_portal"` so it passes for Core after the canonical fix.

### D. Dashboard widgets and KPIs match plan + industry

- `IndustryWidgetGrid` and `CompanyAdminDashboard` already use `useIndustryPack` for KPI relabel and Simple-mode tile selection. After (A) the `requiredTier` checks on Leads/Inventory/Campaigns/Social Posts/Blog Posts will resolve correctly for each tier — verify each demo's Simple-mode top-5 KPIs render the right vertical labels.
- Replace any remaining hardcoded "Appointments" labels in widgets with the industry-aware label.

### E. Initialization: every company gets the right rows, every time

Update `supabase/functions/initialize-company-agents/index.ts`:
- Keep tier × consolidated-operative map in sync with (A).
- For each company, also enable the industry pack's `extra_operatives` (booking-mode verticals get `task_triager / calendar_optimizer / review_responder / menu_writer / reservation_optimizer / listing_writer / offer_drafter / comp_analyst / style_consultant / loyalty_coach`).
- Keep upserting (never delete admin-toggled rows).
- Run it once with `all_companies: true` after deploy to backfill all existing 19 companies — including non-demo paid signups.

### F. Signup + checkout: same path for new paid customers

- `src/pages/Auth.tsx` already calls `initialize-company-agents` after company create. After (E) it will write the correct Core/Boost/Pro/Elite rows + the industry's `extra_operatives` automatically for every new signup.
- `supabase/functions/create-checkout/index.ts` is where Stripe upgrades land — verify the price-id → tier map writes the same canonical tier IDs (`starter/connect/performance/command`) that (A) keys off, so an upgrade from Core to Pro re-runs initialization with the new tier.
- After Stripe webhook flips the tier, call `initialize-company-agents` for that company so the operative set expands immediately (no manual re-toggle).

### G. Demo seeder: all 18 industries verified end-to-end

Update `supabase/functions/seed-demo-accounts-v2/index.ts`:
- Use the same canonical tier × operative map from (A) as its source — no separate copy.
- After seeding agents, also enable each industry's `extra_operatives` from `industry_template_packs`.
- Tier mapping stays exactly as the registry: Core (beauty_wellness, restaurants, real_estate, personal_assistant), Boost (handyman, auto_care, appliance_repair, pest_control, fencing), Pro (security_systems, pool_spa, landscape, solar), Elite (hvac, electrical, plumbing, roofing, construction).

After re-seeding, walk every one of the 18 admin demo accounts through:
- Sidebar shows the right groups for that plan + that industry (no Field Ops for booking-mode, Customer Portal visible for Core, Schedule visible for everyone).
- AI Operatives Hub shows the correct Active count: Core 5+aliases, Boost 7+aliases, Pro 9+aliases, Elite 10 + specialists.
- AI Receptionist, Customer Journey Agent, Outreach Agent are present and Active for Core.
- Dispatch + Field Navigation present for Boost+ field verticals.
- Business Finance + Analytics Intelligence + Admin present for Pro/Elite.
- Specialist Operatives auto-activated per industry pack on Pro/Elite, plus per-industry extras for Core booking verticals.
- Customer Portal Console loads (no FeatureGate lock screen) for Core demos.
- Schedule/Appointments page loads with industry-correct labels.

### H. Sanity checks, not just compile

- Run database read after backfill to confirm every company has at least its tier's consolidated operatives enabled.
- Open `personalassistantadmin@demo.com`, `restaurantsadmin@demo.com`, `realestateadmin@demo.com`, `beautywellnessadmin@demo.com` (4 Core), one Boost, one Pro, one Elite, plus a non-demo paid company if present, and verify each visually.
- Update `mem://architecture/canonical-naming-registry` and `mem://platform-operations/demo-account-registry` if any naming or count changes from this pass.

## Files to change

- `src/lib/subscriptionAgentConfig.ts` — single source of truth, consolidated operative IDs as canonical.
- `src/hooks/useSubscription.ts` — make every check normalize legacy IDs through the canonical map.
- `src/hooks/useAIAgentOrchestrator.ts` — keep alias-aware merging; ensure consolidated operatives reflect "enabled" when any of their legacy aliases are enabled.
- `src/pages/AIAgentsHub.tsx` — Core set, no hidden categories, correct trial copy, canonical category labels, correct "Enable Core" action.
- `src/components/dashboard/DashboardLayout.tsx` — Customer Portal/Website at Core, add Schedule entry for all paid tiers, keep field-ops gating + booking-mode hide.
- `src/components/dashboard/CompanyAdminDashboard.tsx` and `IndustryWidgetGrid.tsx` — verify tier gating + industry KPI labels post-fix.
- `src/components/subscription/FeatureGate.tsx` — confirm console/agent gating works against the new canonical map.
- `supabase/functions/initialize-company-agents/index.ts` — read tier map from a single shared list, add industry `extra_operatives`.
- `supabase/functions/seed-demo-accounts-v2/index.ts` — share the same tier map; seed extras.
- `supabase/functions/create-checkout/index.ts` + Stripe webhook path — re-init agents on tier change.

## Backend / data action after code

- Deploy `initialize-company-agents` and call it with `{ all_companies: true }` to backfill every company (demo + paid).
- Re-run the demo seeder to refresh all 54 demo accounts against the corrected map.
- Confirm via DB query that each tier has the expected operative rows enabled for every company.

This is one cohesive pass over the whole platform — not a per-account hotfix.
