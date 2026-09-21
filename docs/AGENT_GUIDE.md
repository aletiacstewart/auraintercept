# Agent guide

Agents are grouped into five plain-English job types (`src/lib/agentTypes.ts`). Every agent routes through the `ai-agent-chat` edge function; the agent registry resolves names, tiers, prompts and tools, and `ai-orchestrator` records the run. Agents coordinate through validated handoffs and a durable event bus — see `docs/AGENT_ARCHITECTURE.md`.

## The five job types

| Job type | What it does | Use it when |
| --- | --- | --- |
| Scheduling | Answers, books, reschedules, confirms | You lose calls or double-book |
| Lead follow-up | Qualifies enquiries, chases quotes | Enquiries go cold before anyone calls |
| Customer service | Answers questions, handles status requests | Repetitive inbound questions |
| Dispatch / field work | Assigns jobs, updates technicians, tracks completion | You run crews in the field |
| Back office | Billing, reminders, reporting, marketing | Admin work eats the evenings |

Anything outside these appears under "Everything else" in the hub, plus industry Special Operatives supplied by the industry pack.

## Where to manage them

`/dashboard/agents` (also `/dashboard/ai-agents`):

- **Discover** — job-type cards, expandable to the agents inside.
- **My Agents** — what is switched on, with status.
- **Performance** — volume, resolution and hand-off metrics.
- **Observability** — per-agent health (error rate, latency, last seen), open alerts, a trace waterfall for individual runs, and the live cross-agent event feed. Alerts can be acknowledged or resolved in place.
- **Approvals / Activity / Conversations** — what agents proposed, ran and said.

## Ready-made prompts

`src/lib/agentPrompts.ts` ships two tones (professional and friendly) for scheduling, lead follow-up, customer service, field work, billing and marketing. Placeholders `[COMPANY_NAME]`, `[INDUSTRY]` and `[SERVICES]` are filled from the company record before the preview renders. Pick one in the agent setup window's wording step, apply, then edit freely; "Reset to template" restores it.

## Writing a custom prompt

1. State who the agent is and which company it works for.
2. State the goal of a conversation in one sentence.
3. List what it may do and what it must never do (pricing, guarantees, medical or legal advice).
4. Give the hand-off rule: when to fetch a human.
5. Keep it under roughly 400 words — longer prompts get less reliable, not more.
