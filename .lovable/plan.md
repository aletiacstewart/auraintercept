# Phase 2: Agent Registry & Service Discovery

Replace the scattered hardcoded agent routing in the chat backend with one registry that every agent lookup goes through.

## What is hardcoded today

Inside `supabase/functions/ai-agent-chat/index.ts` (8,691 lines) there are **five separate maps** that all describe the same 38 agents, and they can drift apart:

| Map | Purpose |
| --- | --- |
| `LEGACY_AGENT_MAP` (line 3528) | old agent name → one of the 10 operatives |
| `TIER_AGENTS` (line 3464) | which operatives each plan tier unlocks |
| `AGENT_PROMPTS` (line 108) | the system prompt per agent |
| `AGENT_TOOLS` (line 1045) + `TOOL_KEY_MAP` (line 4035) | which tools each agent gets |
| `INDUSTRY_SPECIALIST_OPERATIVES` + `SPECIALIST_BASE_PROMPTS` (3503 / 3801) | the 14 specialists |

Three of these are duplicated again in `supabase/functions/ai-orchestrator/index.ts`, `src/lib/agentRegistry.ts` and `src/lib/subscriptionAgentConfig.ts`. Adding an agent today means editing six places.

## What gets built

### 1. `supabase/functions/_shared/agent-registry.ts` (new)

The single source of truth, shared by both edge functions.

- **`BaseAgent`** — abstract class every agent extends. Holds identity (`type`, `name`, `aliases`, `category`, `isSpecialist`), and declares `systemPrompt()`, `tools()`, `capabilities()`, `requiredTier()`. A concrete `DeclarativeAgent` subclass covers all 38 current agents from a plain definition object, so no agent needs bespoke class code unless it later wants custom behaviour.
- **`AgentRegistry`** — `register(agent)`, `find(typeOrAlias)`, `resolve(typeOrAlias, { tier, packExtraOperatives, isPlatformAdmin, inTrial })`, `list({ tier })`, `capabilitiesOf(type)`. `find()` resolves aliases, so `receptionist`, `booking` and `estimate` land on the right operative without a separate legacy map.
- **`resolve()`** returns either the agent plus its prompt/tools/capabilities, or a structured denial (`{ allowed: false, reason, requiredTier }`) — the same shape the 403 `agent_locked` response already uses, so the app's existing upgrade prompt keeps working unchanged.
- **Capability discovery**: each definition lists its tool names; `capabilities()` derives the plain-English list (e.g. "book appointments", "send SMS", "create quotes") so the UI and the handoff prompt can say what a target agent can actually do.

### 2. `supabase/functions/_shared/agent-definitions.ts` (new)

The 38 agent definitions — 10 operatives, their aliases, 14 specialists — each with prompt, tool set, tier and capabilities. Prompt text and tool arrays move here from `ai-agent-chat` verbatim; no wording changes, so behaviour is identical.

### 3. `ai-agent-chat/index.ts` integration

- Delete `LEGACY_AGENT_MAP`, `TIER_AGENTS`, `TOOL_KEY_MAP`, `SPECIALIST_MIN_TIER`, `INDUSTRY_SPECIALIST_OPERATIVES`, `SPECIALIST_BASE_PROMPTS` and the `getRequiredTierForAgent` helper.
- One call near the top of the request replaces them:
  ```ts
  const resolution = registry.resolve(agentType, { tier, packExtraOperatives, packMinTiers, isPlatformAdmin, inTrial });
  if (!resolution.allowed) return agentLockedResponse(resolution);
  const agent = resolution.agent;
  ```
  then `agent.systemPrompt()` and `agent.tools()` feed the existing model call.
- Industry prompt deltas, the pack alias keys and pipeline tool injection stay exactly as they are — they layer on top of the registry's base prompt/tools.
- Handoff targets are validated through `registry.find()`, so a handoff can no longer point at an agent that doesn't exist.

### 4. `ai-orchestrator/index.ts`

Drops its own `LEGACY_TO_OPERATIVE_MAP` and uses `registry.find()` for the same normalization.

### 5. Frontend alignment (no UI change)

`src/lib/agentRegistry.ts` keeps its icons and config fields — those are presentation-only — but its type list, aliases and tier gating are generated from a shared `src/lib/agentCatalog.ts` mirrored from the backend definitions, with a vitest test asserting the two stay in sync. Any future drift fails the test instead of silently degrading an agent.

## Verification

- Vitest: alias coverage (all 24 legacy names resolve), tier gating per plan, specialist gating by industry pack, catalog/backend parity.
- Live requests through the deployed function: a legacy name (`estimate`), a locked agent on a lower tier (expect the 403 upgrade response), and a specialist allowed by an industry pack.

## Out of scope

Prompt rewrites, new agents, new tools, database changes, and the ~20 remaining handoff pairs from Phase 1.
