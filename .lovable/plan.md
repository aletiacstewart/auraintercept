
## Deep Audit Findings

### What's Working Well
- `useMultiAgentChat` → `ai-agent-chat` edge function pipeline is live and functional
- Real tool execution (check_availability, create_appointment, capture_lead, etc.) all hitting actual DB
- Handoff logic in `useMultiAgentChat` fires a follow-up call to the new agent after handoff detection
- Orchestrator (`ai-orchestrator`) processes events, context, handoffs, and event routing via `ai_agent_events`
- All 6 consoles properly use `useMultiAgentChat` with the correct `initialAgent` per the 10-operative model
- Agent configs (`ai_agent_configs`) stored/read from DB via `toggleAgent`

---

### Issues Found — Grouped by Severity

#### CRITICAL: Backend Agent Mapping Gaps

**1. `outreach` agent has NO entry in `AGENT_PROMPTS` or `AGENT_TOOLS`**
The `ai-agent-chat` function has these legacy agent IDs in `AGENT_PROMPTS`: `campaign`, `lead`, `marketing` — but the consoles now send `initialAgent: 'outreach'`. When the backend receives `agentType: 'outreach'`, it falls through to a generic fallback prompt and gets the default `handoff_to_agent`-only toolset. The Outreach Agent has no real prompt, no real tools.

**Fix**: Add `outreach` to `AGENT_PROMPTS` (consolidating campaign + lead + marketing prompts) and add `outreach` to `AGENT_TOOLS` (all three legacy toolsets merged).

**2. `field_navigation` agent has NO entry in `AGENT_PROMPTS` or `AGENT_TOOLS`**
`FieldOpsAgentConsole` sends `initialAgent: 'field_navigation'`. Backend has `dispatch`, `route`, `eta`, `checkin` — but NOT `field_navigation`. Same fallback problem.

**Fix**: Add `field_navigation` to `AGENT_PROMPTS` (consolidating dispatch + route + eta + checkin) and `AGENT_TOOLS`.

**3. `business_finance` agent has NO dedicated `AGENT_TOOLS` entry**
It falls through to the `admin` toolset which only has basic quote/invoice/inventory tools. `business_finance` should get the full `quoting` + `invoice` + `inventory` merged toolset.

**Fix**: Add `business_finance` to `AGENT_TOOLS` mapping to the merged quoting+invoice+inventory tools.

**4. `analytics_intelligence` agent uses wrong tool key**
`AnalyticsAgentConsole` sends `initialAgent: 'analytics_intelligence'`. The tool lookup does `AGENT_TOOLS[agentType]` which yields nothing for `analytics_intelligence` (the key is `analytics`).

**Fix**: Add a `analytics_intelligence` key to `AGENT_TOOLS` pointing to the analytics tools, OR add it to the toolKey remapping logic.

**5. `creative_content` agent prompt exists but tools use legacy `social` toolKey**
The console sends `creative_content` which gets the `social` tools via toolKey remapping — but that remapping only catches `social_content`, `social_scheduler`, `social_analytics`. `creative_content` is NOT in that list.

**Fix**: Add `creative_content` to the toolKey remapping to point to `social` tools.

---

#### IMPORTANT: Orchestrator Agent Type Mismatch

The `ai-orchestrator` `AGENT_TYPES` defines the 10 consolidated agents correctly, but `EVENT_ROUTING` still routes to legacy agent IDs like `dispatch`, `field_navigation`, etc. that may not match `ai_agent_configs` entries. Since `handleProcessPendingEvents` filters by `enabledAgents` from the DB, any event targeting `dispatch` won't fire unless a company has explicitly enabled an `ai_agent_config` with `agent_type: 'dispatch'`.

**Fix**: Add legacy→consolidated name normalization in the orchestrator's `handleEmitEvent` to ensure events route to the correct agent type that matches configs.

---

#### CONSISTENCY: `AGENT_PROMPTS` Has Duplicate/Stale Entries

The function has both `creative_content` (correct 10-operative) AND `creative` (legacy duplicate) with nearly identical content. Similarly `analytics` and `analytics_intelligence` coexist. The `admin` prompt describes "business operations" but is mapped to admin-level tasks — which is correct for the 10-operative model but the description says "generates quotes" which is `business_finance`'s job.

**Fix**: Clean up duplicate prompts (`creative` → redirect to `creative_content`, `analytics` → redirect to `analytics_intelligence`). Clarify `admin` prompt to focus on scheduling/team/customers only.

---

#### SAVE FEATURES: Social Content Drafts Save Correctly
The `create_social_post` tool correctly saves to `social_content_drafts` with `source: 'ai_chat'` — this is working. The `SocialFeedQueue` component in the "My Posts" tab also reads from this table. This is functional.

---

#### UI CONSISTENCY: `SocialMediaAgentConsole` placeholder text

The `FloatingInput` has `placeholder="Ask about posts, scheduling..."` — "scheduling" should be removed per prior directive to remove scheduling references from non-admin pages. Should say `"Ask about content, captions, platforms..."`.

---

### Implementation Plan

**File: `supabase/functions/ai-agent-chat/index.ts`** — The main fix. All 5 backend mapping gaps are in this one file.

1. **Add `outreach` to `AGENT_PROMPTS`**: Consolidate the `campaign` + `lead` + `marketing` prompts into a single unified Outreach Agent prompt covering all three domains with cross-domain handoff instructions.

2. **Add `field_navigation` to `AGENT_PROMPTS`**: Consolidate `dispatch` + `route` + `eta` + `checkin` prompts into one Field Navigation Operative prompt covering all field workflow stages.

3. **Add `outreach` to `AGENT_TOOLS`**: Merge `campaign` tools + lead management tools + `marketing` tools + social tools into one `outreach` toolset.

4. **Add `field_navigation` to `AGENT_TOOLS`**: Merge `dispatch` + `route` + `eta` + `checkin` tools into one `field_navigation` toolset.

5. **Add `business_finance` to `AGENT_TOOLS`**: Merge `quoting` + `invoice` + `inventory` toolsets.

6. **Add `analytics_intelligence` to `AGENT_TOOLS`**: Alias to the `analytics` toolset.

7. **Fix `toolKey` remapping**: Add `creative_content`, `outreach`, `field_navigation`, `business_finance`, `analytics_intelligence` to the toolKey resolution map.

8. **Clean up duplicate prompts**: Remove `creative` and `analytics` duplicate entries (or have them delegate to the canonical 10-operative names).

9. **Fix `admin` prompt**: Scope it correctly to scheduling, staff management, customer profiles only (not quoting — that belongs to `business_finance`).

**File: `src/components/social/SocialMediaAgentConsole.tsx`**
- Change `placeholder="Ask about posts, scheduling..."` → `placeholder="Ask about content, captions, platforms..."`

**File: `supabase/functions/ai-orchestrator/index.ts`**
- Add a `LEGACY_TO_OPERATIVE_MAP` that normalizes legacy agent IDs to their 10-operative equivalents when routing events, ensuring DB config lookups work correctly.

---

### Files to Edit
1. `supabase/functions/ai-agent-chat/index.ts` (primary — 7 changes)
2. `supabase/functions/ai-orchestrator/index.ts` (1 change — agent normalization)
3. `src/components/social/SocialMediaAgentConsole.tsx` (1 change — placeholder)

### What Does NOT Need Changing
- All 6 console components — already correctly sending the right `initialAgent` per the 10-operative model
- `useMultiAgentChat` — handoff, history, and save logic all working
- `useAIAgentOrchestrator` — toggle/save/subscribe all functional
- `AgentHowToGuide` — already updated per previous work
- `tutorialSteps.ts` — already updated per previous work
- Tool execution logic (the `executeAgentTool` switch block) — tools execute correctly when called, the issue is just that the wrong toolsets are assigned to the 10-operative agent IDs
