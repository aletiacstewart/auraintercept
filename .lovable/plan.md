

# Redesign to 4-Tier Pricing Structure

## Summary
Migrate the entire pricing system from 3 tiers (Connect $297 / Performance $497 / Command $697) to 4 tiers (Starter $197 / Connect $497 / Performance $997 / Command $1,997). This touches the homepage pricing cards, both comparison tables, the dashboard subscription page, and the core config files.

## Files to Modify

### 1. `src/lib/subscriptionAgentConfig.ts` — Core tier config
- Add `starter` to `SubscriptionTier` type: `'free' | 'starter' | 'connect' | 'performance' | 'command'`
- Add `starter` tier config with 4 agents: `triage`, `customer_journey`, `creative_content` (+ booking/followup mapped)
- Update `connect` to $497/mo with 7 agents (adds dispatch, route, marketing, web_presence)
- Update `performance` to $997/mo with 9 agents (adds admin, quoting, invoice, inventory, insights, performance)
- Update `command` to $1,997/mo with 10+ agents (full suite + predictive AI hub)
- Update `TIER_HIERARCHY`, `TIER_EMPLOYEE_LIMITS`, `LEGACY_TIER_MAP`, `TIER_FEATURE_CONFIG`
- Update all consoles per tier

### 2. `src/lib/documentationConfig.ts` — Documentation config
- Add `aura_starter` tier definition ($197, 4 operatives, 3 consoles, 10 employees)
- Update `aura_connect` to $497, 7 operatives, 5 consoles, 25 employees
- Update `aura_performance` to $997, 9 operatives, 6 consoles, 50 employees
- Update `aura_command` to $1,997, 10+ operatives, 7+ consoles, unlimited employees
- Update `PLATFORM_STATS` totals

### 3. `src/pages/Index.tsx` — Homepage pricing cards
- Change from 3-card grid (`md:grid-cols-3`) to 4-card grid (`md:grid-cols-2 lg:grid-cols-4`)
- Add Aura Starter card (teal accent, $197, "Entry Level" badge)
- Update Connect card to blue accent, $497, "Most Popular" badge
- Update Performance card to purple accent, $997, "Growth" badge
- Update Command card to gold accent, $1,997, "Enterprise" badge, outline button
- Update employee counts (10 / 25 / 50 / Unlimited)
- Update agent/operative counts (4 / 7 / 9 / 10+)
- Update "See More Details" expandable content for each card per user spec
- Update bottom text: implementation fees ($0 / $299 / $599 / $999)
- Update hero stats from "10 AI Operatives" to match new structure
- Update `howItWorks` step 2 text

### 4. `src/components/landing/PricingComparisonTable.tsx` — Homepage comparison table
- Add `starter` column to `FeatureRow` interface
- Add 4th column header for Aura Starter ($197)
- Update all feature rows with starter column values per spec
- Update column widths from 4-col to 5-col layout
- Update section headers with new agent/console counts (4 / 7 / 9 / 10+)
- Gate features correctly:
  - Starter: Triage, Booking, Follow-Up, Creative Content only
  - Connect: adds Dispatch, Route, Marketing, Web Presence
  - Performance: adds Admin, Quoting, Invoice, Inventory, Insights, Performance agents
  - Command: full suite + Predictive AI Hub
- White-Label: x / x / check / check (only Performance+Command)
- Update pricing rows

### 5. `src/pages/Subscription.tsx` — Dashboard subscription page
- Add `starter` tier to `TIERS` array with correct pricing/highlights
- Update all existing tier pricing ($497/$997/$1,997)
- Update `TIER_EMPLOYEE_LIMITS` (starter: 10, connect: 25, performance: 50, command: unlimited)
- Add `starter` column to comparison `sections` array
- Update `FeatureRow` interface to include `starter`
- Update table headers to show 4 columns
- Update FAQ answers with new tier names/prices
- Update implementation fee text
- Update grid from `lg:grid-cols-3` to `lg:grid-cols-4`

### 6. `src/components/agents/TierComparisonCards.tsx` — Agent tier cards
- Add Starter tier card
- Update pricing/counts on all tier cards
- Update upgrade summary bar at bottom

### 7. Edge functions (system prompts)
- `supabase/functions/ai-agent-chat/index.ts` — Update tier descriptions in system prompt
- `supabase/functions/landing-chat/index.ts` — Update pricing info in system prompt

### 8. Other files referencing old pricing
- `src/components/subscription/ThirdPartyCostDisclosureDialog.tsx` — May need tier-aware updates
- PDF generation files that reference tier pricing
- Help center content

## Technical Notes
- The `SubscriptionTier` type change propagates through all imports; TypeScript will flag any missing `starter` cases
- Legacy tier map needs `'starter': 'starter'` self-map and old `'starter'` mapping removed (it currently maps to `'connect'`)
- Comparison tables go from 4-column to 5-column layout; column widths adjust to ~26% feature + ~18.5% per tier
- All "See More Details" content is defined inline in the pricing cards on Index.tsx

