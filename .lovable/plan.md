

## Deep Dive: AI Agent Health Check

### Current Status: Agents ARE Functioning
The `creative_content` agent **is already combined** with social media. Here's how it works:
- `creative_content` is the single operative that handles social content creation, scheduling, and analytics
- The backend `TOOL_KEY_MAP` routes `creative_content → social` toolset
- The Social Media Console correctly uses `creative_content` as its agent
- Legacy names (`social_content`, `social_scheduler`, `social_analytics`) all map back to `creative_content`

### Issue Found: Frontend/Backend Tier Config Mismatch

The frontend and backend are **out of sync**, though agents work due to a bypass:

```text
FRONTEND (subscriptionAgentConfig.ts)     BACKEND (ai-agent-chat TIER_AGENTS)
─────────────────────────────────────     ────────────────────────────────────
3 tiers: Connect / Performance / Command  7 tiers: starter / scheduling / growth /
10 consolidated operative IDs               business / field_ops / performance / command
(triage, customer_journey, outreach...)   24 legacy agent names
                                          (booking, followup, social_content...)
```

**Why it still works:** Line 3412 has `CONSOLIDATED_OPERATIVE_IDS` that bypass tier validation for all 7 consolidated IDs. But this is fragile — any new agent or tier change could break.

### Recommended Fix

**1. Sync backend TIER_AGENTS to match the frontend 3-tier model**
- File: `supabase/functions/ai-agent-chat/index.ts` (lines 3321-3372)
- Replace the 7-tier `TIER_AGENTS` with the 3-tier structure using consolidated IDs:
  - `connect`: `['triage', 'customer_journey']`
  - `performance`: all 10 operatives except `admin`, `analytics_intelligence`
  - `command`: all 10 operatives
- Keep legacy tier name aliases mapping to the correct new tier
- Remove `CONSOLIDATED_OPERATIVE_IDS` bypass (no longer needed)

**2. Update `getRequiredTierForAgent` helper** (lines 3374-3384)
- Simplify to check only 3 tiers instead of 7

**3. Update legacy alias mappings** (lines 3357-3371)
- Map old tier names (`starter`, `scheduling`, `growth`, `business`) to `connect`/`performance`/`command`

### No Changes Needed
- Social Media Console — already correctly uses `creative_content`
- Orchestrator — already has `LEGACY_TO_OPERATIVE_MAP`
- Frontend `subscriptionAgentConfig.ts` — already correct
- `TOOL_KEY_MAP` — already correctly routes all agents to tools

