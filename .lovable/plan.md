

# Update AI Agent Counts to Full 24 Agents

## Summary
The pricing cards currently show "4 / 7 / 9 / 10+ AI Operatives" (the consolidated operative count). Update all pricing cards, "See More Details" sections, and comparison tables to reflect the full 24 Smart AI Agents distributed across tiers.

## Agent Distribution (24 total)

- **Aura Starter (8 agents)**: AI Receptionist, Booking Agent, Follow-Up Agent, Review Agent, Creative Content Agent, Campaign Agent, Lead Agent, Outreach Agent
- **Aura Connect (16 agents)**: All Starter + Dispatch Agent, Route Agent, ETA Agent, Check-In Agent, Marketing Agent, Web Presence Agent, Social Feed Queue, Social Analytics Agent
- **Aura Performance (22 agents)**: All Connect + Admin Agent, Quoting Agent, Invoice Agent, Inventory Agent, Insights Agent, Performance Agent
- **Aura Command (24 agents)**: All Performance + Revenue Agent, Forecast Agent (+ Predictive AI Hub)

## Files to Modify

### 1. `src/pages/Index.tsx` — Pricing cards
- Update bullet points on each card: "4 AI Operatives" → "8 Smart AI Agents", "7" → "16", "9" → "22", "10+" → "24"
- Update description text under price to match new counts
- Update the checklist items to list key agent names relevant to each tier
- Update "See More Details" expanded content (currently just toggles the comparison table — keep that behavior, but update card-level details)

### 2. `src/components/landing/PricingComparisonTable.tsx` — Comparison table
- Update section title from "AI Agents (4 / 7 / 9 / 10+)" → "AI Agents (8 / 16 / 22 / 24)"
- Add missing agents to the feature rows: Review Agent, ETA Agent, Check-In Agent, Campaign Agent, Lead Agent, Outreach Agent, Revenue Agent, Forecast Agent, Social Feed Queue, Social Analytics Agent
- Set correct check/x gating per tier for each of the 24 agents
- Add tooltip descriptions for new agents

### 3. `src/lib/subscriptionAgentConfig.ts` — Core config
- Update `TIER_AGENT_CONFIG` agent arrays to include all 24 granular agent names per tier (not just the consolidated operatives)
- Update tier descriptions to reference correct agent counts (8/16/22/24)

### 4. `src/components/agents/TierComparisonCards.tsx` — Dashboard tier cards
- Update `AGENT_NAMES` map with all 24 agents
- Agent counts will auto-update from config changes

### 5. `src/pages/Subscription.tsx` — Dashboard subscription page
- Update agent counts in tier cards and comparison sections to match 24-agent model

## Technical Notes
- The `subscriptionAgentConfig.ts` currently uses consolidated operative names (e.g., `customer_journey` for Booking+Follow-Up+Review). We'll expand the agent arrays to list all 24 individual agent IDs while keeping the legacy mapping intact for backward compatibility.
- The comparison table adds 10 new rows to the AI Agents section (from 14 → 24 rows).

