
## Review of Claude's recommendations

The diagnosis is **correct**. `AGENT_DEFINITIONS` in `src/pages/AgentDetailPage.tsx` still uses the pre-consolidation 24-granular-agent keys (booking, followup, review, route, eta, checkin, quoting, invoice, inventory, campaign, lead, insights, forecast, revenue, performance, creative, social_content, social_scheduler, social_analytics). The hub (`AIAgentsHub.tsx`) navigates using the canonical operative IDs — `customer_journey`, `outreach`, `creative_content`, `business_finance`, `field_navigation`, `analytics_intelligence` — none of which exist in the definitions map, so those 6 operative cards + all 14 specialist cards route to "Agent Not Found." Only `triage`, `dispatch`, `admin`, `web_presence` survived because their keys are unchanged.

Legacy settings rows are safe: `useAIAgentOrchestrator.ts` (line 190–200) already merges old `agent_type` values via `normalizeAgentName`, so any settings previously saved under `booking.*`, `inventory.*`, etc. will surface under the new consolidated key without a data migration.

### Judgment calls — my take

1. **Drop `PLATFORM_ADMIN_ONLY_AGENTS = ['inventory']`.** Correct. `AIAgentsHub.tsx` (line 279) already gates `business_finance` from non-platform-admins via `HIDDEN_AGENTS_FOR_NON_PLATFORM_ADMIN`, so the detail-page gate is redundant *for now* — but the hub gate also currently hides `business_finance` from company_admins. Removing the detail-page restriction alone won't expose it because they can't reach the card. The real question is whether `business_finance` should be visible to company_admins at all; that's outside this fix. **Recommendation: remove the detail-page restriction as proposed**, and flag the hub-visibility question separately.

2. **`creative_content` written fresh rather than concatenated.** Reasonable — mechanically merging 4 overlapping definitions produces a form nobody wants to fill out. Approving the editorial rewrite.

## Plan

### Edit `src/pages/AgentDetailPage.tsx`

1. **Replace `AGENT_DEFINITIONS`** — keep the 4 working keys (`triage`, `dispatch`, `admin`, `web_presence`) verbatim; delete the 19 stale keys; add the 6 merged operative keys and 14 specialist keys from Claude's prompt (24 total). Add any missing lucide-react icon imports (`MessageCircleHeart`, etc.) to the top-of-file import block.

2. **Remove `PLATFORM_ADMIN_ONLY_AGENTS = ['inventory']`** and the `isRestrictedAgent` check that consumes it (line 645). Nothing else references it.

### Not touched

- `useAIAgentOrchestrator.ts` — legacy-name merging already handles surfacing old settings under new keys.
- `AIAgentsHub.tsx` — hub already uses canonical IDs; no change needed.
- `AgentTestConsole.tsx` / `AgentEventLog.tsx` — consume `agentId` directly, unaffected by the definitions map.
- No DB migration; no edge functions.

### Flagged, not fixed here

- `outreach` (24 fields) and `analytics_intelligence` (18 fields) will render as long flat forms. Follow-up: group into collapsible sections inside `AgentSettingsPanel.tsx`.
- Whether `business_finance` should be visible to company_admins in the hub (currently platform-admin-only via `HIDDEN_AGENTS_FOR_NON_PLATFORM_ADMIN`).

### Acceptance

- All 10 operative cards + all 14 specialist cards open a real settings page.
- Companies with legacy settings rows see their old values pre-filled under the new consolidated keys (via existing orchestrator merge).
- `business_finance` opens normally for a platform_admin; hub visibility rules unchanged.
