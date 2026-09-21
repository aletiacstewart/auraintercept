# Agent architecture

Aura Intercept resolves 38 agent IDs through a single registry: 10 core
operatives, 24 legacy aliases that map onto those operatives, and 14 industry
specialists enabled by industry packs. That is the functional model. This
document adds a **reference layer**: five plain-English job types that make the
line-up easy to explain to owners, sales prospects and new staff.

Source of truth for the reference layer: `src/lib/agentTypes.ts`.
Source of truth for the functional agents: `supabase/functions/_shared/agent-registry.ts`
(tiers, prompts, tools, capabilities — it replaced the hardcoded
`LEGACY_AGENT_MAP` / `TIER_AGENTS` maps) and the `ai-agent-chat` backend function.

## How agents coordinate

- **Structured handoffs** — when one agent hands off to another it passes a
  validated `AgentContext` (customer, appointment, service, IDs), not a text
  summary. Missing required fields block the handoff with a plain-language
  error instead of a broken transfer.
- **Event bus** — successful tool calls emit durable events
  (`appointment.created`, `technician.assigned`, `job.completed`, …) into
  `ai_agent_events`. Subscribing agents claim their queued events at the start
  of their next session and act on them; the background agent worker is the
  fallback delivery path. Event payloads carry record IDs only.
- **Workflows** — multi-step jobs (e.g. NewServiceRequest: triage → booking →
  dispatch → field navigation → customer SMS) run through the workflow engine
  with 3x retry and escalation to staff on repeated failure.
- **Observability** — every run is traced and metered; error rate and latency
  alerts surface in the Agents hub Observability tab.

## The five job types

| Type | What it does | Needs connected | Best fit | Covers agents |
| --- | --- | --- | --- | --- |
| Appointment Scheduler | Answers calls, books work, sends reminders | Voice, Calendar | All | `triage`, `booking`, `customer_journey` |
| Lead Qualifier | Screens inbound leads, collects details, routes to sales | Voice, CRM | All | `lead`, `outreach`, `quoting` |
| Customer Service Agent | Answers questions, changes appointments, escalates | SMS, Email | All | `customer_journey`, `admin`, `review` |
| Field Operations Agent | Dispatch, routing, live job updates | SMS, Calendar | Plumbing, HVAC, Electrical, Cleaning | `dispatch`, `field_navigation`, `route`, `eta`, `checkin` |
| Follow-Up Agent | Win-back and follow-up outreach, upsells, reporting | Voice, CRM | All | `followup`, `review`, `campaign`, `marketing` |

## When to use each

- **Appointment Scheduler** — the default first agent for any business that
  books time. Start here before anything else.
- **Lead Qualifier** — add when call volume includes a lot of tyre-kickers, or
  when quoting takes up staff time.
- **Customer Service Agent** — add when most contact is questions and changes
  rather than new bookings.
- **Field Operations Agent** — only for businesses that send people to a site.
  Industry packs without field technicians hide these surfaces automatically.
- **Follow-Up Agent** — add once there is customer history worth re-contacting,
  usually after the first 30–60 days of live use.

## Industry starter sets

Defined in `AGENT_TEMPLATES`:

- HVAC / Plumbing / Electrical — Scheduler + Field Ops + Follow-Up
- Cleaning — Scheduler + Customer Service
- Automotive — Scheduler + Lead Qualifier
- General service — Scheduler + Customer Service

## Prompts

Agent prompts are not stored here. Each operative's system prompt is built at
runtime and enriched with the company's industry pack terminology (see
`mem://architecture/industry-prompt-injection-standard`). To adjust behaviour
for a job type, edit the prompt deltas on the relevant industry pack rather
than this document.

## Required integrations

- Voice — SignalWire + ElevenLabs
- SMS — SignalWire
- Email — Resend
- Calendar — Google Calendar
- CRM — HubSpot, Salesforce, Zoho, Pipedrive or a custom webhook

Each provider is the customer's own account and is billed directly by that
provider, separately from the Aura plan fee.
