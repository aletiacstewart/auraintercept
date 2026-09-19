---
name: Agent type reference layer (5 job types)
description: src/lib/agentTypes.ts maps the 24 agents onto 5 plain-English job types — descriptive only
type: feature
---
`src/lib/agentTypes.ts` defines `AGENT_TYPES` (Appointment Scheduler, Lead Qualifier, Customer Service, Field Operations, Follow-Up) and `AGENT_TEMPLATES` (per-industry starter sets), plus `getAgentTypeForAgent(agentId)`.

DESCRIPTIVE ONLY. It does NOT replace or gate the canonical 24-agent / 10-operative model in `src/lib/agentStyles.ts` and `ai-agent-chat`. Each type lists the existing agent ids it covers. Written companion: `docs/AGENT_ARCHITECTURE.md`.
