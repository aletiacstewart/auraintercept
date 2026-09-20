# Sync 6 legacy agent names into the backend

## What this fixes
Six older agent names — `receptionist`, `emergency`, `intake`, `faq`, `estimate`, `payments` — are translated in the app's front-end but missing from the backend's own maps. If any screen ever sends one raw, the backend quietly falls back to a generic assistant instead of the right specialist. This makes the backend match the front-end so it can't silently degrade.

## Changes (edit only, no new files)

1. **`supabase/functions/ai-agent-chat/index.ts`** — `LEGACY_AGENT_MAP` (line 3517): add
   - `receptionist`, `emergency`, `intake`, `faq` → `triage` (the AI Receptionist operative — confirmed the backend fully supports `triage`: prompt, tools, tier lists, handoffs)
   - `estimate`, `payments` → `business_finance`
   - Matches the front-end map in `src/lib/subscriptionAgentConfig.ts` exactly.

2. **`supabase/functions/ai-orchestrator/index.ts`** — `LEGACY_TO_OPERATIVE_MAP` (top of file): add the same six entries so bookkeeping/status resolves the same way.

3. Redeploy both functions.

## Verification
- Typecheck + build pass.
- Invoke `ai-agent-chat` once with `agentType: "receptionist"` and once with `"estimate"` (a test company context) and confirm the response uses the AI Receptionist / Business Finance behavior rather than the generic fallback.
- Confirm tier gating still applies after normalization (legacy names resolve to the operative's tier).

## Out of scope
No front-end changes — the app's map already has these names; this only closes the backend gap.
