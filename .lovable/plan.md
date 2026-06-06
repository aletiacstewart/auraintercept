# Platform-Wide Deep-Dive Audit — Fix Plan

Two parallel audits (backend health + AI-agent code paths) produced **37 findings**. This plan groups them by risk and ships in 4 waves so we can deploy and verify between batches.

## Wave 1 — Critical (security + broken agents)

1. **Add `customer_journey` system prompt** to `ai-agent-chat/index.ts` `AGENT_PROMPTS` so Starter-tier customers stop hitting the generic fallback. Include handoff targets dispatch / business_finance / outreach / triage.
2. **Sync `TIER_AGENTS`** between `src/lib/subscriptionAgentConfig.ts` and `supabase/functions/ai-agent-chat/index.ts`:
   - Add `web_presence` to Starter on the edge side
   - Add `business_finance`, `analytics_intelligence`, `admin` to Performance on the edge side
   - Export one canonical map from a shared file and import it both sides; add a build-time assertion
3. **Auth-gate `ai-orchestrator` and `aura-unified`** edge functions: verify JWT, then assert `auth.user.company_id === body.companyId`. For cron callers, accept a shared `ORCHESTRATOR_SECRET` header instead.
4. **Add `invalid_grant` guard to `google-calendar-webhook`** mirroring `google-calendar-sync`: on refresh-token rejection, flip `sync_enabled=false`, insert `platform_issues` (high), insert `staff_notifications` reconnect prompt.
5. **Move hardcoded anon JWT out of migrations** (`20260417150241`, `20260503030542`). Replace with a Vault-stored `CRON_INTERNAL_KEY`; rotate the current anon key after the replacement migration lands.

## Wave 2 — High (silent failures + drift)

6. **Update every `handoff_to_agent` tool enum** in `ai-agent-chat` to be the union of legacy + canonical names so OpenAI schema validation stops dropping consolidated handoffs.
7. **Register missing cron jobs** in a new migration:
   - `aura-ai-orchestrator` (`*/2 * * * *`) → drain `ai_agent_events` pending
   - `aura-calendar-sync-drain` (`*/5 * * * *`) → drain `calendar_sync_jobs`
   - `aura-social-token-refresh` (`0 3 * * *`) → preempt social token expiry
   - `aura-generate-social-batch` (`0 7 * * *`)
   - `aura-push-cleanup` (daily) → delete `push_subscriptions` older than 30d
8. **Rename `VITE_SUPABASE_PUBLISHABLE_KEY` → `VITE_SUPABASE_ANON_KEY`** in `AIAgentTestSuite.tsx`, `AIAgentSettings.tsx`, `TTSProviderSettings.tsx`, `VoiceCloningCard.tsx` (5 files). Prefer `supabase.functions.invoke()` where possible.
9. **Fix `cron-health-check`** column mismatch: `context` → `metadata` on the `platform_issues` insert.
10. **Harden `trg_sync_company_workspace`** trigger: call edge function with an internal-secret header instead of anon key; in the `EXCEPTION` block, insert a `platform_issues` row so silent failures become visible.
11. **Schema constraints**: new migration adds
    - `google_calendar_connections.refresh_token NOT NULL`
    - `ai_agent_configs CHECK (agent_type NOT IN ('warranty','crm','booking_legacy','lead_legacy'))`
    - One-time `DELETE FROM ai_agent_configs WHERE agent_type IN ('warranty','crm')`
12. **Remove dead warranty tool cases** (`check_warranty`, `submit_warranty_claim`) from all agent tool schemas and from `industryFieldOpsWorkflows.ts`.
13. **Validate SignalWire webhook signature** in `voice-swaig/index.ts` using HMAC-SHA256 + new `SIGNALWIRE_WEBHOOK_SECRET` secret.
14. **Per-operative ElevenLabs agent mapping**: add `elevenlabs_agent_map` JSONB to `tenant_integrations` and use it in `elevenlabs-conversation-token`.

## Wave 3 — Medium (cleanup + observability)

15. Add unhandled event types to `EVENT_ROUTING` or mark them `event_category='audit'`.
16. Replace legacy IDs in analytics agent prose prompts (`forecast`, `revenue`, `performance`, `campaign`) with canonical IDs.
17. Migrate `AIAgentTestSuite` to `supabase.functions.invoke()` with the production payload shape.
18. Delete duplicate `creative` and `analytics` entries from `AGENT_PROMPTS`; fix lookup order to use `normalizedAgentType` first.
19. New migration: `REVOKE ALL ON public.campaign_sends, push_subscriptions, staff_notifications, staff_notification_preferences FROM anon`.
20. Add circuit-breaker (consecutive-failure counter) to `publish-social-content` and `appointment-reminders`.
21. AFTER INSERT trigger on `companies` → call `initialize-company-agents` via internal-secret path so every new company has agent configs.
22. Auto-resolve `platform_issues` in `cron-health-check` when the underlying company is healthy again; add unique partial index `(company_id, issue_type) WHERE status='new'`.

## Wave 4 — Low (polish)

23. Extend `get_autonomy_cron_jobs()` RPC with `failure_count_24h`, `last_failure_at`, `last_success_at`.
24. Standardize all edge-function imports to `npm:` specifiers; bump `deno.land/std` to 0.224.
25. Add `social` → `creative_content` alias to `LEGACY_AGENT_MAP`.
26. Replace `quoting` with `business_finance` in inventory agent prompt (line 547).
27. Wrap OSM/OSRM calls (`calculate_eta`, `assign_technician`) with 3s timeout + straight-line fallback.
28. Move `rateLimitStore` for `landing-chat` to durable storage (Supabase table or KV).
29. Tighten `RequiredTier` TS union type so display-name tiers fail at compile time.

## Verification per wave

- Wave 1: deploy → call `ai-agent-chat` as Starter customer w/ `customer_journey`, hit `/customer-portal` and confirm no fallback; manually call `ai-orchestrator` without JWT and expect 401; revoke a calendar token and confirm `platform_issues` row appears.
- Wave 2: `select * from cron.job where jobname like 'aura-%'` shows 5 new jobs; `ai_agent_events` pending count stays at 0 over 10 minutes; build passes.
- Wave 3: insert a row with `agent_type='warranty'` and expect CHECK violation; confirm `cron-health-check` issues auto-resolve.
- Wave 4: typecheck catches a stray `requiredTier="core"` literal.

## Technical notes / risks

- **Out of scope this plan**: visual/UI changes, marketing copy, demo seeding. Tier display naming stays Core/Boost/Pro/Elite at the surface; internal keys stay starter/connect/performance/command (memory rule).
- **Risk**: editing `AGENT_PROMPTS` is large; we'll keep changes additive only (no prompt rewrites for working operatives).
- **Backward compatibility**: legacy agent IDs remain mapped via `LEGACY_AGENT_MAP`; we only add canonical names to enums, never remove legacy ones.
- **Secrets to add**: `ORCHESTRATOR_SECRET`, `CRON_INTERNAL_KEY`, `SIGNALWIRE_WEBHOOK_SECRET` (will prompt before adding).
- **Migrations**: 4 new files — schema constraints, cron-jobs add, anon REVOKE, companies AFTER INSERT trigger. All have GRANTs as required.

Reply **approve** to start with Wave 1, or tell me to reorder/skip any item.
