

# Batch 2 — Core UI Pages (3-Tier Consolidation)

## Summary
Update 7 UI files to remove all legacy 7-tier references and align with the canonical 3-tier model (Connect $297, Performance $497, Command $697).

---

## Changes by File

### 1. `src/pages/Auth.tsx`
- **Line 56**: Change `selectedTier` type from `'express' | 'flow' | 'halo' | 'core' | 'single_point' | 'multi_track' | 'command'` to `'connect' | 'performance' | 'command'`
- **Line 57**: Update comment from "7-tier" to "3-tier"
- **Lines 709**: Change "all 24 AI agents" → "all 10 AI operatives"
- **Lines 725-792**: Replace the 7-tier selector (two groups: "Industry-Specific Packages" + "General Business Plans") with 3 simple rows:
  - Connect ($297) — Solo operators, salons, consultants
  - Performance ($497) — HVAC, plumbing, field service — marked Popular
  - Command ($697) — Multi-location, enterprise
- **Lines 794-809**: Update the selected tier display to only reference 3 tiers
- **Lines 841-843**: Update 3rd-party cost notes (remove "Logistics+" references, use "Performance+" instead; remove "Presence+" use "Connect+")

### 2. `src/pages/Subscription.tsx`
- **Lines 71-203**: Replace the 7-entry `TIERS` array with 3 entries:
  - `{ id: 'connect', name: 'Aura Connect', monthlyPrice: '$297', annualPrice: '$2,970', annualSavings: 'Save $594', agentCount: 5, consoleCount: 4, ... }`
  - `{ id: 'performance', name: 'Aura Performance', monthlyPrice: '$497', annualPrice: '$4,970', annualSavings: 'Save $994', agentCount: 8, consoleCount: 6, popular: true, ... }`
  - `{ id: 'command', name: 'Aura Command', monthlyPrice: '$697', annualPrice: '$6,970', annualSavings: 'Save $1,394', agentCount: 10, consoleCount: 7, ... }`
- **Lines 206-214**: Replace `TIER_EMPLOYEE_LIMITS` with 3 entries: `connect: 5, performance: 15, command: 50`
- **Lines 216-323**: Replace the 7-column `FeatureRow` interface and `sections` array with a 3-column structure (`connect`, `performance`, `command`). Rebuild all feature comparison rows for 3 tiers with correct agent/console gating per the canonical model.
- **Lines 635**: Change grid from `lg:grid-cols-4` to `lg:grid-cols-3`
- **Lines 726-756**: Replace 7-column table headers with 3 columns (Connect $297, Performance $497, Command $697)
- **Lines 758-789**: Update table body rendering to use 3 columns instead of 7

### 3. `src/pages/Index.tsx`
- **Line 418**: Change "up to 24 Smart AI Agents" → "up to 10 AI Operatives"
- **Line 593-596**: Change heading "24 Smart AI Agents" → "10 AI Operatives" and update subtitle
- **Line 867**: Change "7 AI Operatives" → "8 AI Operatives" (Performance tier has 8)
- **Line 1049**: Change "Required for: Logistics, Performance, Command" → "Required for: Performance, Command"
- **Line 1060**: Change "Required for: Presence, Performance, Command • Optional for: Growth, Logistics" → "Required for: Performance, Command • Optional for: Connect"

### 4. `src/pages/DemoAccounts.tsx`
- **Lines 30-107**: Replace 7 demo account entries with 3 + platform admin:
  - Aura Connect ($297) — 5 agents, 4 consoles
  - Aura Performance ($497) — 8 agents, 6 consoles
  - Aura Command ($697) — 10 agents, 7 consoles

### 5. `src/pages/TermsOfService.tsx`
- **Line 36**: Change "24 specialized AI operatives" → "10 AI operatives"
- **Line 55**: Change "$197 to $697 per month across 7 tiers (Aura Starter through Aura Command)" → "$297 to $697 per month across 3 tiers (Aura Connect, Aura Performance, and Aura Command)"
- **Line 56**: Update employee range from "2–50" to "5–Unlimited"

### 6. `src/pages/Contact.tsx`
- **Lines 174-179**: Replace 6 tier options in the service interest dropdown with 3:
  - Aura Connect ($297)
  - Aura Performance ($497)
  - Aura Command ($697)

### 7. `src/components/landing/CompetitiveDifferentiation.tsx`
- **Line 41**: Change "From $397" → "From $297"

---

## Technical Notes
- The `PricingComparisonTable.tsx` on the homepage is already updated to 3 tiers — no changes needed there.
- The homepage pricing cards (lines 800-953 in Index.tsx) are already correct with 3 tiers and correct prices — only minor copy fixes needed (agent counts, integration requirement labels).
- The `Subscription.tsx` comparison table is the largest single change — the 7-column `FeatureRow` type and all `sections` data must be rebuilt for 3 columns.

