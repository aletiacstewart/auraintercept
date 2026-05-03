## AI Operative Prompt Audit — Industry Context Injection

Ensure every AI operative edge function injects the caller's industry pack into its system prompt so AI replies use the right terminology, scope, and guardrails (e.g. dental "treatment plan" vs HVAC "quote", healthcare HIPAA guardrails, salon "clients" vs "jobs").

### Scope

Audit all operative edge functions under `supabase/functions/` that build a system prompt for an LLM call (chat, voice, SMS auto-reply, content gen, lead triage, field navigation, etc.).

### Steps

1. **Inventory** every edge function that calls an LLM and builds a system prompt. Catalog which already call `applyIndustryPackToPrompt` (or equivalent) and which don't.
2. **Centralize** the helper. If `applyIndustryPackToPrompt` lives only in one function, lift it into a shared module (e.g. `supabase/functions/_shared/industryPack.ts`) so every function imports the same logic. Helper should:
   - Load the company's `industry_template_packs` row
   - Inject `terminology`, `agent_prompt_deltas` (with DELTA_KEY_ALIASES), `address_required`, and any vertical guardrails
   - No-op safely when company has no pack
3. **Wire missing functions** to call the helper before sending the prompt to the model. Priority order:
   - `ai-agent-chat` (verify alias map still applied)
   - `voice-*` / SignalWire SWML prompt builders
   - `sms-auto-responder` and outbound SMS draft
   - `content-engine-*` (blog, social caption gen)
   - `lead-triage`, `customer-journey`, `outreach`
   - Any analytics/insight functions that summarize data narratively
4. **Healthcare guardrails**: for healthcare verticals, append the existing HIPAA guardrail block (no PHI echo, no diagnosis, route to provider) — reuse existing copy from healthcare integrations registry if present.
5. **Memory**: update `mem://architecture/industry-template-pack-system.md` (or add a new note) documenting the shared helper path and the canonical injection point for every operative.

### Out of Scope

- New industry packs or new agent types
- UI changes (purely server-side prompt work)
- Translating prompts (English only this round)

### Files (expected)

- `supabase/functions/_shared/industryPack.ts` (new — shared helper)
- Individual `supabase/functions/<operative>/index.ts` updates (1–2 line import + call each)
- Memory note update

Reply **go** to execute, or scope it down to a subset of operatives.
