I agree this needs a complete pass, not another narrow fix. I checked the homepage plan details, signup flow, dashboard/sidebar gates, AI Operatives Hub, plan config, demo seeder, and company-agent initializer. There is still drift in multiple places.

Key issues found:
- Homepage pricing buttons do not pass the selected tier into signup, so users can click Boost/Pro/Elite and still default to Core.
- Homepage “See More Details” table is out of sync with the actual tier matrix. Example: Outreach is shown as Pro-only in the table, but Core is supposed to include Outreach & Sales.
- Signup copy says the 90-day trial includes all 24 agents/all 7 control centers regardless of plan, which conflicts with the rule that trial access honors the selected plan.
- Sidebar gates still hide Core/Boost items incorrectly:
  - Outreach & Sales is gated as Boost even though Core includes it.
  - Field Ops is gated as Pro in the sidebar even though Boost includes it.
  - Website/Web Presence is gated as Boost in one place even though Core includes it.
- AI Operatives Hub only has fixed default specialists for a few trades and does not fully render all industry-pack specialists such as `style_consultant`, `loyalty_coach`, `task_triager`, `calendar_optimizer`, `menu_writer`, etc.
- `initialize-company-agents` and the demo seeder add industry extras without consistently honoring the plan/min-tier mapping.
- Demo account seeding uses a fixed technician role for every industry, which is wrong for booking-only industries like real estate, beauty, restaurants, and personal assistant.
- Dashboard cards/quick actions still use legacy tiers like `multi_track`/`command` directly, creating more hidden or inconsistent UI.
- Plan documentation/help pages still contain old tier requirements and contradict current Core/Boost/Pro/Elite behavior.

Plan to fix the whole system:

1. Create one canonical plan registry for UI + setup
- Centralize the 4-tier product matrix so homepage pricing, signup, subscription gates, AI Operatives Hub, dashboard nav, help docs, and backend setup all reference the same source of truth.
- Preserve the required 4-tier model:
  - Aura Core: $197
  - Aura Boost: $497
  - Aura Pro: $997
  - Aura Elite: $1,997
- Keep legacy tier aliases working through `LEGACY_TIER_MAP`, but normalize everything before checking access.
- Define both:
  - consolidated operatives: the 10 operative architecture
  - displayed Smart AI Agents: the 8/12/16/24 customer-facing agent count

2. Fix homepage pricing and “See More Details”
- Update the homepage pricing cards so each “Start Free Trial” button passes the correct `tier` query param into signup.
- If an industry has been selected on `/for-business`, keep passing that industry through too.
- Rewrite the comparison table to match the canonical plan matrix:
  - Core must show AI Receptionist, Booking, Follow-Up, Review, Lead/Marketing/Outreach, Creative Content, Web Presence, Customer Portal, Outreach & Sales, and Creative/Web Presence.
  - Boost must add Field Ops/Dispatch/Route/ETA/Check-In and Social where appropriate.
  - Pro must add Business/Finance/Admin/Analytics plus eligible industry specialists.
  - Elite must show the full 24-agent / 7-control-center suite plus AI Operatives Hub.
- Remove outdated “required external account/cost” language that contradicts the bundled-usage rule.

3. Fix signup so selected plan + selected industry drive the created setup
- Make signup always preserve the selected plan from URL or user selection.
- Make industry selection required for company signup, with canonical industry IDs only.
- Replace the incorrect “trial includes everything regardless of plan” copy with “90-day free trial of the plan you selected.”
- Ensure all entry points pass plan/industry correctly:
  - homepage pricing
  - `/for-business` industry page
  - demo conversion/start flows
  - subscription upgrade/checkout flows

4. Fix dashboard/sidebar/control-center visibility for every plan
- Update `DashboardLayout` to use the canonical console matrix instead of hardcoded/wrong `requiredTier` values.
- Correct specific gates:
  - Outreach & Sales visible on Core+
  - Customer Portal visible on Core+
  - Schedule/Appointments visible on Core+
  - Customer Website / Web Presence visible on Core+
  - Field Ops visible on Boost+ except industries whose pack hides/booking-modes field ops
  - Social Media visible according to the final canonical matrix
  - Business Management and Analytics visible according to the final canonical matrix
  - Specialist Operatives visible on Pro+ when the selected industry has eligible specialists
  - AI Operatives Hub visible as a management interface for company admins, with locked cards for higher-tier operatives rather than hiding almost everything
- Fix the sidebar plan badge so it shows Aura Core/Boost/Pro/Elite instead of falling back to Free.

5. Fix all console gates and landing pages
- Audit every `FeatureGate requiredConsole` usage and align it with the canonical console IDs.
- Ensure these routes are reachable when included in the selected plan:
  - Customer Portal Console
  - Schedule/Appointments
  - Customer Website App / Web Presence
  - Outreach & Sales Console
  - Social Media Console
  - Field Operations Console
  - Business Management Console
  - Analytics & Reports Console
  - Specialist Operatives Console
  - AI Operatives Hub
- For booking-only industries, keep field-service-only views hidden but replace them with industry-appropriate schedule/booking/showings/reservation/client-console labels.

6. Fix AI Operatives Hub and specialist rendering
- Expand the AI Operatives Hub agent catalog so it can show every specialist operative currently defined in industry packs, not just the four old trade specialists.
- Use the labels/descriptions from `subscriptionAgentConfig.ts` for specialists.
- Render industry-selected specialists only when:
  - the company’s industry pack includes them, and
  - the company’s selected plan meets `min_tier_per_extra` or the default Pro+ specialist rule.
- Make locked higher-tier agents visible with clear upgrade labels instead of appearing missing.
- Update “Enable Recommended” to activate all Core operatives, not old/partial groups.

7. Fix backend company initialization and demo seeding
- Update `initialize-company-agents` so every new/live company gets the correct `ai_agent_configs` based on both:
  - normalized subscription tier
  - canonical industry pack
- Enforce `min_tier_per_extra` for industry specialists instead of blindly adding all extras.
- Keep legacy agent rows for backwards compatibility, but make consolidated operative rows authoritative for UI gates.
- Update `seed-demo-accounts-v2` to:
  - preserve the demo industry-to-plan mapping already set up
  - seed correct company tier + industry
  - seed correct AI configs
  - seed appropriate employee job roles per industry instead of always `technician`
  - seed demo data that matches each industry and plan
- After changes, run the global initializer/backfill for all existing companies so current live, demo, and future accounts align.

8. Fix in-app dashboard cards, quick actions, and help/docs that still use old tiers
- Replace stale `multi_track`, old Pro/Elite-only references, and old 5-tier language in dashboard cards/quick actions/help pages.
- Update `PlatformGuides`, `AIAgentGuide`, and tier comparison components so they reflect the same canonical matrix.
- Ensure no UI says CRM/Warranty or passes third-party usage fees to the customer.

9. Validation pass across all account types
- Validate the resulting matrix for:
  - all 4 plans: Core, Boost, Pro, Elite
  - all 18 industries
  - admin dashboards
  - employee/technician or industry-role dashboards
  - customer portal flows
  - demo accounts
  - new signup accounts
  - existing/live companies after backfill
- Spot-check specific broken examples:
  - AI Receptionist visible and enabled
  - Schedule/Appointments visible
  - Customer Portal visible
  - Outreach & Sales visible for Core
  - Web Presence visible for Core
  - Field Ops visible for Boost field-service industries
  - Specialist Operatives visible for eligible Pro/Elite industries
  - booking-only industries show booking/schedule/customer surfaces instead of irrelevant field-dispatch surfaces

Implementation files expected to change:
- `src/lib/subscriptionAgentConfig.ts`
- `src/hooks/useSubscription.ts`
- `src/hooks/useAIAgentOrchestrator.ts`
- `src/components/dashboard/DashboardLayout.tsx`
- `src/components/dashboard/CompanyAdminDashboard.tsx`
- `src/components/subscription/FeatureGate.tsx`
- `src/components/landing/PricingComparisonTable.tsx`
- `src/pages/Index.tsx`
- `src/pages/ForBusiness.tsx`
- `src/pages/Auth.tsx`
- `src/pages/AIAgentsHub.tsx`
- `src/pages/ai-consoles/*`
- `src/pages/PlatformGuides.tsx`
- `src/pages/AIAgentGuide.tsx`
- `src/components/agents/TierComparisonCards.tsx`
- `supabase/functions/initialize-company-agents/index.ts`
- `supabase/functions/seed-demo-accounts-v2/index.ts`
- `supabase/functions/create-checkout/index.ts`

After approval, I will implement this as a system-wide synchronization and backfill, not just fix the one visible screen.