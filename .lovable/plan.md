## Goal
Sweep the entire platform for AI agent issues: runtime errors, broken connections (API keys, integrations), failed handoffs between agents, and misconfigured routing — then deliver a prioritized fix list.

## Scope of audit

### 1. Edge function health (runtime)
Pull recent logs and error rates for every AI-touching function:
- `ai-agent-chat`, `ai-agent`, `ai-agent-health`, `ai-orchestrator`
- `ai-router`, `ai-voice-*`, voice/SMS inventory functions
- `google-calendar-sync`, `google-calendar-auth`, `google-calendar-webhook`
- `signalwire-*`, `elevenlabs-*`, `resend-*`, `tavily-*`
- `check-subscription`, reminder/cron functions
Look for: 4xx/5xx spikes, timeouts, unhandled exceptions, `invalid_grant`, missing keys, CORS failures.

### 2. Agent configuration integrity
Query `ai_agent_configs` per company:
- Missing/disabled core operatives (the 10-operative model)
- Agents with empty `settings` or no system prompt
- Stale agent IDs not in the canonical 24-agent → 10-operative map
- `tenant_integrations`: missing OpenAI / ElevenLabs / SignalWire / Resend keys for tiers that require them

### 3. Handoff / event routing
- Inspect `ai_agent_events` for `status='failed'` in last 7 days, group by source→target
- Check `EVENT_ROUTING` table/map against actual agents emitting events
- Verify booking handoff (chat → create_appointment → calendar sync) end-to-end
- Verify voice handoff (SignalWire → ElevenLabs agent → call_logs → follow-up SMS)
- Verify SMS keyword auto-responder bypass path

### 4. Integration / connection health
- `google_calendar_connections` with `invalid_grant` or expired tokens (sync_enabled flip)
- `social_accounts` with expired OAuth
- `tenant_integrations` flags vs actual key presence
- Stripe customer/subscription mismatches surfaced in `check-subscription`
- Push subscriptions stale (`push_subscriptions`)

### 5. Cross-surface routing
- `auraIntentDetection` / `auraQueryParser` → confirm all intents resolve to a real agent
- Dashboard navigation: every operative card → working console
- Customer portal AI: ElevenLabs agent ID resolution
- Technician AI console: agent availability

### 6. Data integrity flags
- Companies with `subscription_tier` but no agent configs
- Agents enabled for tier the company isn't on (tier drift)
- Orphaned `ai_agent_logs` with errors and no retry

## Deliverable
A categorized report with:
- **Critical** (broken for real users now) — e.g. Aura Intercept's `invalid_grant` calendar
- **High** (degraded, silent failures) — failed handoffs, missing keys
- **Medium** (config drift) — stale agent IDs, tier mismatches
- **Low** (cleanup) — orphaned rows, log noise

Each finding gets: company_id (or "platform-wide"), affected function/agent, evidence (log snippet or count), and recommended fix.

## Technical approach
- Use `supabase--analytics_query` for edge log aggregations (group by function_id, status_code, last 7d)
- Use `supabase--read_query` for config/integration table sweeps
- Use `supabase--edge_function_logs` for deep-dive on top offenders
- No code changes in this pass — audit only. A follow-up plan will propose fixes per finding.

## Out of scope
- Actual fixes (separate plan after findings)
- UI/visual issues
- Customer-specific data corrections beyond surfacing them
