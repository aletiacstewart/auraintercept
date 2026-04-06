

# Rename Tiers to Core / Boost / Pro / Elite + Update Agent Distribution

## Summary
Rename all 4 tier display names platform-wide and update the agent distribution for the Core tier. Internal tier IDs (`starter`, `connect`, `performance`, `command`) remain unchanged for backward compatibility — only user-facing labels change.

**Name mapping:** Aura Starter → **Aura Core**, Aura Connect → **Aura Boost**, Aura Performance → **Aura Pro**, Aura Command → **Aura Elite**

**Agent redistribution for Aura Core (8 agents):**
- Remove: Campaign Agent, Outreach Agent
- Add: Web Presence Agent, Marketing Agent
- New Core agents: Triage, Booking, Follow-Up, Review, Creative Content, Web Presence, Lead, Marketing

**Agent redistribution for Aura Boost (12 agents):**
- All Core agents + Dispatch, Route, ETA, Check-In (no Campaign/Outreach here either — those move up)
- Wait — user spec says Boost includes "Campaign Agent, Outreach Agent, Social Feed Queue Agent" on top of Core + field ops. Let me re-read.
- Boost = All Core (8) + Dispatch, Route, ETA, Check-In, Campaign, Outreach, Social Feed Queue = **15 agents?** But user says 12.
- User says: "12 AI Agents: All Core agents + Dispatch Agent, Route Agent, ETA Agent, Check-In Agent, Campaign Agent, Outreach Agent, Social Feed Queue Agent" — that's 8+7=15, but labeled "12". I'll follow the explicit count of 12 and the listed agents. Actually re-reading: "All Core agents + Dispatch, Route, ETA, Check-In" = 12. Then the See More Details says the full list including Campaign, Outreach, Social Feed Queue — that's 15. There's a contradiction.
- Looking more carefully at See More Details: "12 AI Agents: All Core agents + Dispatch Agent, Route Agent, ETA Agent, Check-In Agent, Campaign Agent, Outreach Agent, Social Feed Queue Agent" = 8+7=15. But the card says "12". I'll go with the See More Details list (which is the detailed spec) and update the count to match — likely the user wants all those agents, so 15 is wrong for "12". Actually the simplest interpretation: the card count should match the detailed list. So either the count or the list needs adjustment.

I'll present both options and default to trusting the detailed "See More Details" list as authoritative, updating the card count to match (15 for Boost). But actually let me re-read once more...

User says for Boost:
- Card: "AI Operatives / Agents: 12"
- See More: "12 AI Agents: All Core agents + Dispatch Agent, Route Agent, ETA Agent, Check-In Agent, Campaign Agent, Outreach Agent, Social Feed Queue Agent"

8 Core + 7 new = 15, not 12. I'll flag this discrepancy and go with the See More Details list as the definitive spec (15 agents for Boost), OR I'll count exactly what the user listed. Since the user explicitly says "12" on the card, perhaps Campaign and Outreach are already in Core via the "All Core agents" part? Let me check Core's See More: "8 AI Agents: AI Receptionist (Triage), Booking Agent, Follow-Up Agent, Review Agent, Creative Content Agent, Web Presence Agent, Lead Agent, Marketing Agent". No Campaign or Outreach in Core. So 8+7=15. This is a discrepancy I should flag.

Similarly for Pro: "18 AI Agents: All Boost agents + Admin, Quoting, Invoice, Inventory, Insights, Performance, Revenue, Forecast, Social Analytics" = 15+9=24, but says 18. Another discrepancy.

I'll ask the user to clarify.

## Files to Modify (once agent counts confirmed)

### 1. `src/lib/subscriptionAgentConfig.ts`
- Update `label` fields: 'Aura Core', 'Aura Boost', 'Aura Pro', 'Aura Elite'
- Update agent arrays for starter tier: swap `campaign`+`outreach` for `web_presence`+`marketing`
- Update connect tier agents per confirmed list
- Update `LEGACY_TIER_MAP`: add `'aura_core': 'starter'`, `'aura_boost': 'connect'`, etc.

### 2. `src/pages/Index.tsx`
- Rename all card titles, descriptions, badge text, and "See More Details" content
- Update implementation fee line: "$0 Core • $299 Boost • $599 Pro • $999 Elite"
- Update agent lists per confirmed distribution

### 3. `src/components/landing/PricingComparisonTable.tsx`
- Rename column headers from Starter/Connect/Performance/Command → Core/Boost/Pro/Elite
- Update agent gating rows per new distribution
- Update section count headers

### 4. `src/pages/Subscription.tsx`
- Rename TIERS array names, FAQ text, implementation fee text
- Update comparison table headers
- Update agent gating in comparison sections

### 5. `src/components/agents/TierComparisonCards.tsx`
- Labels auto-derive from `TIER_AGENT_CONFIG` — will update automatically

### 6. `supabase/functions/ai-agent-chat/index.ts`
- Update tier display names in system prompt and TIER_AGENTS mapping

### 7. `supabase/functions/landing-chat/index.ts`
- Update pricing tier descriptions in system prompt

### 8. `supabase/functions/create-checkout/index.ts`
- Update `name` fields to new tier names

### 9. Other files (Help.tsx, helpContentConfig.ts, documentationConfig.ts, PlatformDocumentPDF.tsx)
- Find-and-replace tier display names

## Clarification Needed

The agent counts on the cards don't match the "See More Details" lists:
- **Aura Core**: Card says 8, Details lists 8 agents — OK
- **Aura Boost**: Card says 12, but Details lists 8 Core + 7 new = **15 agents**
- **Aura Pro**: Card says 18, but Details lists all Boost + 9 more = **24 agents** (or 27 if Boost is 15+9)
- **Aura Elite**: Card says 24 — this is the full suite

Should I (A) keep the card counts (8/12/18/24) and trim the "See More Details" agent lists to match, or (B) keep the detailed agent lists and update the card counts?

