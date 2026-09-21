# Docs & Content Refresh After Agent-Coordination Work

Audit verdict: the homepage and integration/onboarding/voice guides are still accurate. The docs that describe agent architecture predate the last two days of work (structured handoffs, agent registry, event bus, workflow orchestrator, Observability tab) and need updating. No new features are being built — this is a documentation-only pass.

## What stays as-is (verified current)

- Homepage (`src/pages/Index.tsx`) — generic marketing copy, no stale claims. No changes.
- `docs/INTEGRATION_GUIDE.md` — matches Upload-Post + unified Connections page.
- `docs/ONBOARDING_FLOW.md`, `docs/VOICE_SETUP.md` — accurate for their scope.
- `README.md` — boilerplate, nothing to update.

## Updates

1. **`docs/ARCHITECTURE.md`** — update the system diagram and data-flow narrative to include the agent registry (replaces hardcoded LEGACY_AGENT_MAP/TIER_AGENTS), the durable event bus (`ai_agent_events` + subscriptions), the workflow orchestrator (`workflow_runs`, retry/escalation), and the observability stack (tracing spans, metrics rollups, alert rules, `/health`).

2. **`docs/AGENT_ARCHITECTURE.md`** — replace the "24 named agents, static map" framing with: 38 IDs resolved through the registry (10 operatives, 24 legacy aliases, 14 industry specialists), structured AgentContext handoffs with validation, tool→event emission, and queued-event pickup at session start.

3. **`docs/AGENT_GUIDE.md`** — add the Observability tab to the Agent Hub tab list; describe what alerts, traces, and the event feed show and how to acknowledge/resolve an alert.

4. **`docs/NAVIGATION_MAP.md`** — add the Observability tab under `/dashboard/agents`.

5. **`docs/FEATURE_GUIDE.md`** — add an Observability row: health metrics, alert rules (error rate > 5%, latency), trace waterfall, live event feed.

6. **`docs/DATABASE.md`** — expand the AI table group: `ai_agent_events` described as the durable bus with per-agent subscriptions; add `workflow_runs`; note the new tracing/metrics columns on `ai_agent_logs` and `agent_performance_metrics`.

7. **`roadmap.md`** — remove the now-false "docs complete" claim or mark it superseded; add a completed entry for the agent-coordination work (structured handoffs, registry, event bus, orchestrator, observability).

8. **In-app help content** (`src/lib/helpSystemPrompt.ts`, `src/lib/industryHelpContent.ts`) — targeted read, then update any agent-routing claims so the built-in help assistant doesn't describe the old flat routing model.

9. **Platform roster PDF** — regenerate `Aura_Intercept_Platform_Roster.pdf` with a short new section covering orchestration (event bus, workflows, observability) so the exported document matches the platform.

## Out of scope

- No code changes to features; docs/help/PDF only.
- `/health` endpoint stays internal-facing — documented in ARCHITECTURE.md, not added to the public status page.
