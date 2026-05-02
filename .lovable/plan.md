I checked the current implementation and the issue is broader than one demo account. The selected plan and industry are being saved, but several screens still do not consume that mapping consistently.

Key findings:
- Current accounts do have `industry_vertical` and `subscription_tier` populated.
- Demo accounts are seeded from the intended industry-to-tier map, but the seeder still writes older agent IDs like `booking`, `followup`, `review`, `lead`, `marketing`, `route`, `eta`, etc.
- The visible AI Operatives Hub only renders the newer consolidated operative IDs like `customer_journey`, `outreach`, and `field_navigation`, so enabled legacy rows can exist without showing correctly in the UI.
- New real signups save company plan + industry, but they do not immediately initialize the company’s enabled AI agent configuration from that plan + industry.
- Company admins are currently blocked from seeing the AI Operatives Hub in the sidebar even though the plan details say the Hub is included across paid tiers.
- Some Core features listed in the subscription detail table are incorrectly gated higher in dashboard navigation.

Plan to fix it across all accounts:

1. Create one canonical plan-to-agent resolver
   - Add a single shared resolver for the 4-tier model:
     - Aura Core: `starter`
     - Aura Boost: `connect`
     - Aura Pro: `performance`
     - Aura Elite: `command`
   - Normalize legacy agent IDs into current operative IDs everywhere they are read:
     - `booking`, `followup`, `review` -> `customer_journey`
     - `lead`, `marketing`, `campaign` -> `outreach`
     - `route`, `eta`, `checkin` -> `field_navigation`
     - `quoting`, `invoice`, `inventory` -> `business_finance`
     - `social_scheduler`, `social_analytics`, `social_content` -> `creative_content`
     - `insights`, `performance`, `revenue`, `forecast` -> `analytics_intelligence`
   - Keep the 24-agent marketing model visible as sub-agent chips/details inside the 10 operative cards, so users still see “Booking Agent”, “Follow-Up Agent”, “Review Agent”, etc. while the backend uses consolidated operatives.

2. Fix the AI Operatives Hub display
   - Update `useAIAgentOrchestrator` so it treats legacy enabled rows as enabled current operatives.
   - Show Aura Core clearly:
     - AI Receptionist
     - Customer Journey Agent with Booking / Scheduling, Follow-Up, Review chips
     - Creative Content Agent
     - Web Presence Agent
     - Outreach Agent with Lead + Marketing chips
   - Make the “Enable Recommended” action activate the full plan-appropriate set, not only a hardcoded legacy “4 core” set.
   - Show industry-specific add-ons only when the selected industry pack includes them, and label them clearly.

3. Make new accounts initialize correctly at signup
   - After company creation, initialize `ai_agent_configs` from the selected plan and selected industry.
   - This ensures every new company immediately gets the correct Core / Boost / Pro / Elite agent set before the owner ever opens the Hub.
   - The initialization will also include valid industry extras from the industry template pack.
   - This keeps future signups from repeating the current missing-agent state.

4. Fix current existing accounts
   - Run a backend data update for all existing companies.
   - For each company:
     - Read `subscription_tier`.
     - Read `industry_vertical`.
     - Resolve the correct plan agents.
     - Add missing normalized operative rows.
     - Preserve already-enabled legacy rows but make the current rows active too.
   - This covers all current real accounts and demo accounts without requiring each user to manually reseed.

5. Fix demo account seeding permanently
   - Update `seed-demo-accounts-v2` so it writes normalized current operative IDs instead of only legacy IDs.
   - Keep the user’s demo mapping intact:
     - Core: Beauty & Wellness, Restaurants, Real Estate, Personal Assistant
     - Boost: Handyman, Auto Care, Appliance Repair, Pest Control, Fencing
     - Pro: Security Systems, Pool/Spa, Landscape, Solar
     - Elite: HVAC, Electrical, Plumbing, Roofing, Construction
   - Re-running the demo seeder will then produce correctly mapped dashboards and agents every time.

6. Fix dashboard/sidebar feature access to match plan details
   - Make AI Operatives Hub visible to company admins on paid/trial accounts.
   - Ensure Aura Core shows Core features from the plan table:
     - Customer Portal / AI Receptionist surface
     - Appointments / scheduling
     - Calendar sync
     - Creative / Web Presence
     - Outreach & Sales where Core says it is included
   - Keep Field Ops / Dispatch hidden for booking-only industries like Personal Assistant, Beauty, Restaurants, and Real Estate.
   - Keep higher-tier-only features locked or hidden according to the plan matrix.

7. Fix industry dashboard widgets
   - For booking-first industries, especially Personal Assistant, replace confusing field-service widgets with clear Core workflow widgets:
     - AI Receptionist
     - Schedule / Bookings
     - Calendar Sync
     - Client Portal
     - Follow-Up / Reviews
   - Routes will point to the appropriate existing pages: AI console/customer portal, appointments, calendar integration, client/customer portal, and review/follow-up setup.

8. Verify all account categories
   - Verify `personalassistantadmin@demo.com` shows:
     - AI Operatives Hub in the sidebar.
     - AI Receptionist active.
     - Scheduling / Booking visible.
     - Customer Journey details visible for Booking, Follow-Up, and Review.
     - Core Creative/Web/Outreach items visible.
     - No technician/dispatch/field-ops labels.
   - Spot-check Core, Boost, Pro, and Elite demo accounts.
   - Spot-check the real Aura Intercept tenant and any non-demo companies.

Technical changes expected:
- `src/lib/subscriptionAgentConfig.ts`
- `src/hooks/useAIAgentOrchestrator.ts`
- `src/pages/AIAgentsHub.tsx`
- `src/components/dashboard/DashboardLayout.tsx`
- `src/components/dashboard/IndustryWidgetGrid.tsx`
- `src/pages/Auth.tsx` or a backend account-initialization function it calls
- `supabase/functions/seed-demo-accounts-v2/index.ts`
- A backend data update for existing `ai_agent_configs` rows across all companies

No schema change is needed unless the existing table constraints block the backfill. This is primarily a data normalization and feature-gating consistency fix.