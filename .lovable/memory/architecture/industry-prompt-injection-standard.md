---
name: Industry prompt injection standard
description: Canonical shared helper that injects industry pack context into every AI operative system prompt
type: feature
---
All AI-calling edge functions inject the company's industry pack via `supabase/functions/_shared/industry-pack.ts`:

- `loadIndustryPackForCompany(supabase, companyId)` → returns `{ industry_id, label, terminology, agent_prompt_deltas }` or `null`.
- `applyIndustryPackToPrompt(basePrompt, pack, agentType)` → appends INDUSTRY CONTEXT, PREFERRED TERMINOLOGY, and (for healthcare verticals: dental/chiropractic/medical_office/physical_therapy/optometry/veterinary) a strict HIPAA/no-clinical-advice guardrail block.

Wired functions (ALL must keep the helper call before sending to the model):
- ai-agent, ai-agent-chat (chat), widget-api (chat widget)
- voice-handler, sms-handler
- content-engine, generate-blog-content, generate-blog-batch, generate-social-content, generate-social-batch, generate-social-variations, generate-campaign-content, generate-campaign-series, generate-website-content

Aliasing of free-form agent identifiers → short delta keys lives in `normalizeAgentKey`. ai-agent-chat additionally applies `DELTA_KEY_ALIASES` for canonical→short delta lookup (see industry-pack-prompt-delta-aliases memory).
