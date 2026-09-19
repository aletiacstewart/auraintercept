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
                            ai-orchestrator,                                     scheduled posts)
                            integration probes
                                              |
                      Third parties: Google Calendar, SignalWire, Resend,
                      ElevenLabs, Stripe, Upload-Post, Lovable AI Gateway
```

## Data flow

1. A customer books (public page, phone call, text, or web chat).
2. The relevant edge function writes to Postgres under row-level security scoped to `company_id`.
3. Database triggers create the follow-on work: job assignment, reminders, notifications.
4. AI agents read the same rows through `ai-agent-chat`, and `ai-orchestrator` records what they did.
5. The dashboard reads via React Query; the analytics page aggregates the same tables.

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
