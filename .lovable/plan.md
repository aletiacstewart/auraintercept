
## Goal
1. Remove `social_scheduler` and `social_analytics` agents from the platform entirely
2. Merge `social_content` (Social Media Agent) + `creative` (Creative Agent) into a single new agent: **`creative_content`** — "Creative Content Agent" — handling social posts, image/video creation, and web/campaign content
3. `social_content` becomes `creative_content`; the Social Media console uses it; the Creative & Web Presence console also uses it alongside `web_presence`

---

## New Agent Map (after changes)

**Social Media (1 agent):** `creative_content` — Creative Content Agent
**Creative & Web Presence (2 agents):** `creative_content` + `web_presence`

Total agents: 24 → **21** (removed `social_scheduler`, `social_analytics`, merged `creative` into `creative_content`)

---

## Files to Change

### 1. `supabase/functions/ai-orchestrator/index.ts`
- Remove `social_scheduler` and `social_analytics` from `AGENT_TYPES`
- Rename `social_content` → `creative_content` with name `'Creative Content Agent'`
- Remove `creative` (merged into `creative_content`)
- Update `EVENT_ROUTING`:
  - `content_generated`: remove `['social_scheduler', 'social_analytics']` → `[]` (no fan-out needed or point to `web_presence`)
  - `post_scheduled`, `post_published`: remove `social_analytics` targets
  - `content_published`: remove `social_analytics`, keep `web_presence`
  - `blog_published`: `['web_presence', 'creative_content']`
  - `content_engine_output`: `['creative_content', 'campaign', 'web_presence']`

### 2. `supabase/functions/ai-agent-chat/index.ts`
- Remove `social_scheduler` and `social_analytics` system prompts
- Rename `social_content` key → `creative_content`
- Merge creative agent system prompt into `creative_content`: combined prompt covering social posts (all 6 platforms), AI image/video generation, blog/email/SMS content, website copy, and brand voice
- Update `handoff_to_agent` enum for any agent that referenced `social_scheduler`, `social_analytics`, or `creative` → `creative_content`

### 3. `src/hooks/useAIAgentOrchestrator.ts`
- Remove `social_scheduler` and `social_analytics` from `DEFAULT_AGENTS`
- Rename `social_content` → `creative_content`, name `'Creative Content Agent'`, category stays `social_media` (for console routing)
- Remove `creative` entry
- Update `groupAgentsByCategory` result (automatic since driven by `DEFAULT_AGENTS`)

### 4. `src/lib/subscriptionAgentConfig.ts`
- Replace all `'social_content', 'social_scheduler', 'social_analytics'` → `'creative_content'` in every tier
- Replace `'creative'` → `'creative_content'` in every tier
- Update `AGENT_DEPENDENCIES`: remove `social_scheduler`, `social_analytics`, `creative` keys; add `creative_content: []`
- Update `CONSOLE_REQUIRED_AGENTS`: `social_media: ['creative_content']`, `creative_web_presence: ['creative_content']`

### 5. `src/pages/AIAgentsHub.tsx`
- Update `AGENT_NAMES`: remove `social_scheduler`, `social_analytics`, `creative`; add `creative_content: 'Creative Content Agent'`
- Update `JOB_TYPE_TO_AGENTS`: replace `social_content`, `social_scheduler`, `social_analytics`, `creative` → `creative_content`
- `CATEGORY_INFO.social_media` label stays; `creative_web_presence` label stays

### 6. `src/lib/agentStyles.ts`
- Remove `social_scheduler`, `social_analytics`, `creative` from `AGENT_STYLES`
- Add `creative_content: { label: 'Creative Content', color: 'text-pink-400', bgColor: 'bg-pink-500/10' }`
- Update `AGENT_CATEGORIES.socialMedia`: `['creative_content']`
- Update `AGENT_CATEGORIES.contentEngine`: remove (merged)

### 7. `src/components/social/SocialMediaAgentConsole.tsx`
- Change `initialAgent: 'social_content'` → `'creative_content'`
- Change `lastAgent` default and all references: `'social_content'` → `'creative_content'`
- Update `SOCIAL_AGENTS` array: rename `id: 'social_content'` → `id: 'creative_content'`, name `'Creative Content'`
- Update `AGENT_TO_ACTION` mapping key

### 8. `src/components/ai/agents/OperativeDependencyGraph.tsx`
- Remove `social_scheduler`, `social_analytics`, `creative`, `web_presence` from `AGENT_LABELS`; add `creative_content: 'Creative Content'`
- Update `DEPENDENCY_MAP`: remove `social_scheduler`, `social_analytics`, `creative`; add `creative_content: []`; keep `web_presence: ['creative_content']`
- Update `FLOW_CONFIGS` Social Media section: agents `['creative_content']`
- Update Content Engine section: agents `['creative_content', 'web_presence']` (or merge into one flow)

### 9. `src/components/ai/agents/BatchAgentActivation.tsx`
- Phase 5 `agents` array: replace `['social_content', 'social_scheduler', 'social_analytics', 'creative', 'web_presence']` → `['creative_content', 'web_presence']`

### 10. `src/hooks/useRolePermissions.ts`
- Replace all `social_content`, `social_scheduler`, `social_analytics`, `creative` references → `creative_content`

### 11. `src/components/ai/chat/AgentHowToGuide.tsx`
- In `CONSOLE_GUIDES` social section: update any guide entries that reference `social_scheduler` or `social_analytics` actions
- Add/update guide entries for image/video creation to reflect the merged Creative Content Agent capabilities

### 12. Minor cleanup across display-only files
- `src/lib/helpContentConfig.ts`: remove `social_scheduler`, `social_analytics`, `creative`; add `creative_content`
- `src/components/agents/TierComparisonCards.tsx`: same removals + add `creative_content`
- `src/components/ai/agents/AgentAnalyticsDashboard.tsx`: same
- `src/components/ai/agents/AgentTestConsole.tsx`: same
- `src/lib/documentationConfig.ts`: update Creative & Web Presence agent descriptions

---

## Summary of Agent Count Change
- Before: 24 agents (3 social + 2 creative/web)
- After: 21 agents (1 `creative_content` + 1 `web_presence` in social/creative, removing `social_scheduler`, `social_analytics`, `creative`)
