---
name: Unified Agent Hub v1
description: /dashboard/ai-agents is the single agent surface (Discover, My Agents, Performance, Approvals, Activity, Conversations); old agent pages redirect
type: feature
---

Phase 3 consolidation.

- `src/pages/AIAgentsHub.tsx` at `/dashboard/ai-agents` is the only agent page.
  Tabs: Discover, My Agents, Performance, Approvals, Activity, Conversations
  (`?tab=` deep links). `/dashboard/ai-agents/:agentId` and
  `/dashboard/ai-agents/:agentId/settings` render the hub with the setup window open.
- Discover shows the 5 plain-English job types from `src/lib/agentTypes.ts`,
  each expandable to its member operatives with individual switches, plus an
  "Back-Office & Web" group for operatives no job type claims. The 24-agent /
  10-operative model stays canonical — job types are grouping only.
- Specialists folded in: `src/components/agents/SpecialistOperativesPanel.tsx`
  (was `pages/ai-consoles/SpecialistOperativesConsole.tsx`) renders inside Discover.
  `SpecialistOperativesLauncher` in other consoles links to `/dashboard/ai-agents?tab=discover`.
- New components in `src/components/agents/`: AgentDiscoveryCard, AgentStatusCard,
  AgentConfigModal (4-step: basics, connections, prompt, test), AgentTestModal.
- Metrics come from `useAgentPerformanceMetrics` (ai_agent_events, last 30 days,
  legacy ids normalized).
- Deleted: `pages/AIAgent.tsx`, `pages/AIAgentGuide.tsx`, `pages/AgentDetailPage.tsx`.
  Routes `/dashboard/ai-agent`, `/dashboard/ai-agent-guide`, `/dashboard/ai-consoles/specialists` redirect.
- Sidebar: single "Agents" item (Bot icon) in the Overview group.
