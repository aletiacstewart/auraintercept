# Phase 3 — One Agent Hub

Today the AI agents are spread across five pages: a hub, a single-agent detail page, a guide page, an older console page, and a specialists page. This phase turns all of that into one page at **AI Agents** (`/dashboard/ai-agents`), keeping every feature that works today.

## What the page will look like

Tabs, in order:

1. **Discover** — the five plain-English jobs (Appointment Scheduler, Lead Qualifier, Customer Service, Field Operations, Follow-Up) as cards. Each card shows what the job does, what it needs connected, and an Enable button. Expanding a card reveals the individual agents inside it, each with its own switch, so nothing is hidden. A Specialists section below shows the industry-specific operatives for the company's trade.
2. **My Agents** — every switched-on agent in a row: status light, plain status text, interactions, success rate, average handling time, and a menu with Edit Settings, View Performance, Pause/Resume, Test Agent.
3. **Performance** — totals for the month (interactions, success rate, satisfaction, average resolve time) plus the existing per-agent analytics, with a link into Analytics.
4. **Approvals** — the existing review queue for actions waiting on a human.
5. **Activity** — the existing workflow monitor and dependency view.
6. **Conversations** — the existing conversation history browser.

Settings and testing move into pop-up windows instead of separate pages: a four-step setup window (basics, connections, prompt choice, test and confirm) and a small test window that runs a sample input and shows the reply.

## Pages going away

- Old agent console page (`/dashboard/ai-agent`)
- Agent guide page (`/dashboard/ai-agent-guide`)
- Single-agent detail page (`/dashboard/ai-agents/:agentId`)
- Specialist Operatives page (`/dashboard/ai-consoles/specialists`)

All four send visitors to the hub automatically, so old links and bookmarks keep working. The specialist launchers embedded in the other consoles are untouched.

## Technical notes

- Rewrite `src/pages/AIAgentsHub.tsx` as the single hub; keep the route `/dashboard/ai-agents` and the `AIAgentsHub` export so existing links stay valid.
- New components under `src/components/agents/`: `AgentDiscoveryCard.tsx` (job-type card, expandable to member agents, props `agent`, `isEnabled`, `onEnable`), `AgentStatusCard.tsx` (enabled-agent row with metrics + dropdown), `AgentConfigModal.tsx` (4-step wizard, also opened by route `/dashboard/ai-agents/:agentId/settings` rendering the hub with the modal open), `AgentTestModal.tsx` (wraps the existing test console logic in a dialog).
- Job types come from `src/lib/agentTypes.ts` (`AGENT_TYPES`); the member agents come from `agentStyles.ts` / `AGENT_REGISTRY` via `useAIAgentOrchestrator`. The 24-agent model stays canonical — job types are only a grouping.
- Specialists section reuses `SPECIALIST_DESCRIPTIONS` / `isSpecialistOperative` and the industry pack `extra_operatives` filtering already used by the specialists page.
- Retained components (moved or re-exported, not deleted): `AgentReviewQueue`, `AgentWorkflowMonitor`, `AgentAnalyticsDashboard`, `ConversationHistoryBrowser`, `OperativeDependencyGraph`, `BatchAgentActivation`, `AgentSettingsPanel`, `AgentEventLog`, `AgentStatusIndicator`, `JobStatusMonitor`, `DecisionModeBadge`, `ConfidenceIndicator`. `AgentTestConsole` is kept as the body of the test modal. `AIAgentTestSuite` is kept for platform admins inside Activity.
- Deleted: `src/pages/AIAgent.tsx`, `src/pages/AIAgentGuide.tsx`, `src/pages/AgentDetailPage.tsx`, `src/pages/ai-consoles/SpecialistOperativesConsole.tsx` and its `index.ts` export.
- `App.tsx`: add `<Navigate replace>` redirects for `/dashboard/ai-agent`, `/dashboard/ai-agent-guide`, `/dashboard/ai-agents/:agentId`, `/dashboard/ai-consoles/specialists`; add `/dashboard/ai-agents/:agentId/settings`.
- Update references in `DashboardLayout.tsx` (sidebar: main-menu item "Agents", `Bot` icon), `voiceNavigation.ts`, `helpSystemPrompt.ts`, `PlatformGuides.tsx`, `profileConsoleMap`/tutorial/quick-action entries, `WelcomeModal`, `OnboardingChecklist`, `GoLiveTimeline`, `AuraTodayStrip`, `CompanyAdminDashboard`, `IndustryWidgetGrid`, `Help.tsx`, and the PDF guide components that link to the removed routes.
- Existing tier gating (`canManageAIAgents`, `hasFullAccess`, FeatureGate) carries over unchanged.
- Verify with a typecheck and the build log; deep-link each redirect.
