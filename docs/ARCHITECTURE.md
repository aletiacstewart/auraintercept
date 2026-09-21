# Architecture

## System at a glance

```text
        Visitors / customers            Company staff              Platform admins
               |                              |                           |
        public pages, /book            /dashboard/*                /dashboard/admin/*
               \______________________________|___________________________/
                                              |
                            React 18 + Vite + Tailwind (src/)
                   routing: src/App.tsx   navigation: src/lib/navigationConfig.ts
                                              |
                           Supabase JS client (@/integrations/supabase/client)
                                              |
        +-------------------------+-----------+-----------+--------------------------+
        |                         |                       |                          |
   Postgres + RLS          Edge functions            Storage buckets            Cron jobs
   (companies, leads,      (supabase/functions)      (documents, media)         (nightly health,
    appointments, ...)      ai-agent-chat,                                       reminders,
    ai_agent_events,        ai-orchestrator,                                   scheduled posts,
    workflow_runs, ...)     ai-agent-health,                                   agent worker)
                            integration probes
                                              |
                       Third parties: Google Calendar, SignalWire, Resend,
                       ElevenLabs, Stripe, Upload-Post, Lovable AI Gateway
```

## Agent layer

- **Registry** (`supabase/functions/_shared/agent-registry.ts`) is the source of truth for all 38 agent IDs (10 core operatives, 24 legacy aliases, 14 industry specialists): tiers, prompts, tools, capabilities. It replaced the hardcoded `LEGACY_AGENT_MAP` / `TIER_AGENTS` maps.
- **Structured handoffs** (`_shared/agent-context.ts`): agents pass a validated `AgentContext` object on handoff — never a raw text summary. A handoff missing required fields (e.g. dispatch needs an appointment plus name and phone) is refused with a plain-language error.
- **Event bus** (`_shared/event-bus.ts` + `_shared/event-subscriptions.ts`): tools emit durable events into `ai_agent_events` (e.g. `appointment.created`, `technician.assigned`, `job.completed`); subscribing agents pick them up at session start or via the background agent worker. Payloads carry record IDs only — no contact details.
- **Workflow orchestrator** (`_shared/workflow-engine.ts` + `workflow_runs`): multi-step sequences such as NewServiceRequest (triage → booking → dispatch → field navigation → customer notification) with 3x retry and escalation on failure. Gated by the `workflow_orchestrator` feature flag.
- **Observability** (`_shared/tracing.ts`, `agent-metrics.ts`, `agent-alerts.ts`): every agent call and tool call is a traced span; daily metrics roll up into `agent_performance_metrics`; alert rules (error rate > 5%, tool p95 > 1s, agent silent 24h) open `platform_issues` rows and notify staff. `ai-agent-health` exposes per-agent status.

## Data flow

1. A customer books (public page, phone call, text, or web chat).
2. The relevant edge function writes to Postgres under row-level security scoped to `company_id`.
3. Database triggers create the follow-on work: job assignment, reminders, notifications.
4. AI agents read the same rows through `ai-agent-chat`; successful tool calls emit events that other agents react to, and the orchestrator advances any active workflow runs.
5. The dashboard reads via React Query; the analytics page and the Agents hub Observability tab aggregate the same tables.

## Integration points

| Area | Where it lives |
| --- | --- |
| Credentials per company | `tenant_integrations`, `google_calendar_connections`, `social_accounts` |
| Connection definitions and validation | `src/lib/integrationConfig.ts` |
| Live probes | `supabase/functions/_shared/integration-probes.ts` |
| On-demand health check | `supabase/functions/check-integration-health` |
| Nightly health check | `supabase/functions/integration-health-check` |
| Health history | `integration_health_logs` |

## Key technologies

React 18, Vite 5, TypeScript 5, Tailwind CSS 3, shadcn/ui, React Query, Recharts, Shepherd.js (product tour), Supabase (Postgres, auth, storage, edge functions), Deno for edge functions, Vitest + Playwright for tests.

## Conventions

- Feature access goes through `useFeatureFlags()`, `useIndustryConfig()` and the plan-tier gates — never ad-hoc role checks in a page.
- Navigation comes only from `src/lib/navigationConfig.ts`.
- Components stay under ~300 lines; split by screen section, not by arbitrary line count.
- Every new public table gets GRANTs plus RLS in the same migration.
