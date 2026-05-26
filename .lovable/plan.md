
# Onboarding Readiness Deep Dive — Audit Plan

This is an **audit-first** plan. I will inspect the platform end-to-end, produce a findings report with severity tags (P0/P1/P2), and then fix issues in a follow-up build pass. No code changes happen during the audit pass itself except trivial copy/consistency fixes (typos, broken links, missing labels).

## Scope (7 audit tracks)

### 1. Onboarding Intake → Submission → Admin Review
- Walk `PublicOnboardingIntake.tsx` step-by-step: required fields, validation, plan selection, billing cycle, invoice email, 3rd-party cost acknowledgements (Stripe/SignalWire/ElevenLabs/Resend/Tavily/A2P 10DLC/Social).
- Verify `save-onboarding-progress`, `submit-onboarding`, `upload-onboarding-file`, `get-onboarding-invite`, `create-onboarding-invite` edge functions: error handling, idempotency, file size limits, signed URL expiry.
- `OnboardingInvites.tsx` admin: PDF export parity with intake form, document downloads, status badges, resend invite.
- Confirm `CompanyOnboardingPDF.tsx` mirrors every intake field (carrier forwarding pages, plan block, acknowledgements, signature).
- Check Fast Start Wizard, Custom Industry Wizard, Guided Launch flow for state transitions and abandonment recovery.

### 2. Console Consistency (24 agents → 10 operatives)
- Audit each console page in `src/pages/ai-consoles/` + `src/pages/operations/` for:
  - Navigation route correctness (per Console Routes Standard memory).
  - Empty states use `IndustryEmptyState` with actionable CTAs.
  - Header layout, density (Simple/Pro mode), bidirectional highlight.
  - Tier locks vs soft locks with unlock badges.
  - Agent metric derivation from semantic UI calls (no mock data).
- Verify `BusinessManagementConsole`, `FieldOpsConsole`, `MarketingSalesConsole`, `SocialMediaConsole`, `CustomerPortalConsole`, `SpecialistOperativesConsole`, `AnalyticsConsole` all bind to the correct operative and respect industry pack restrictions.

### 3. AI Agent Handoffs & Agentic Behavior
- Trace `ai-agent`, `ai-agent-chat`, `ai-orchestrator`, `aura-unified`, `voice-navigator`, `voice-booking-agent` for:
  - EVENT_ROUTING handoff chains (per Agent Handoff Logic memory).
  - Tool/action exposure per operative — confirm each agent can actually execute, not just chat.
  - Industry prompt injection via `_shared/workspace.ts` is wired into every agent prompt.
  - Temporal context injection (server clock) present.
  - Human override actions (execute/reject) visible with required color codes.
- Confirm `initialize-company-agents` provisions all 10 operatives on company creation.
- Confirm ElevenLabs client tools are registered for voice agents and that `voice-swaig` / `voice-handler` map agent IDs correctly.

### 4. 3rd-Party Integrations Readiness
- Per Aura policy: every provider requires customer's own account + card; confirm each integration page surfaces this disclaimer.
- `VoiceIntegration`, `SMSIntegration`, `EmailIntegration`, `CalendarIntegration`, `TavilyIntegration`, `SocialMediaIntegration`, `Integrations.tsx` admin page — verify:
  - Carrier Forwarding Guide present (just added) and pre-fills Aura number.
  - Connection status, test buttons, error states.
  - Concierge Onboarding hints reference "we configure using your login + card".
- A2P 10DLC legal steps in signup flow.

### 5. Compliance & Legal Content
- Third-party fee disclaimers everywhere billing prompts appear.
- Multi-location refusal copy correct.
- Trial = 90-day with onboarding fee due at start; subscription progress math.
- Tier pricing displays canonical 4-tier model (Core/Boost/Pro/Elite at matched onboarding+monthly).
- Privacy / TOS / unsubscribe / data deletion endpoints reachable (`unsubscribe`, `social-oauth-data-deletion`).
- SMS opt-in/opt-out keywords (STOP/HELP) wired in `sms-handler`.

### 6. Help / Docs / Knowledge Surfaces
- `AIHelpCenter`, `howToUseContent`, `industryHelpContent`, `industryHelpPrompts`, `AIAgentGuide`, `IntegrationDocs` — verify:
  - Content covers all 10 operatives + onboarding + integrations.
  - Tier-aware filtering matches current 4-tier model.
  - Carrier forwarding instructions reachable from help.
  - Dashboard tutorial steps still reference live UI elements (no orphaned targets).

### 7. Data Integrity & Missing Pieces
- Run DB read queries to confirm: no orphaned `companies` without `industry_vertical`, no operatives missing from `initialize-company-agents` output, no dangling `onboarding_invites` past expiry, RLS GRANTs on all public tables.
- Supabase linter pass.
- `check-subscription` returns 200 OK on failures (per memory).
- Verify `LEGACY_TIER_MAP` covers any in-flight legacy plan IDs.

## Deliverable

A single **findings report** posted to chat, structured as:

```text
[P0] Blocker — file:line — what's wrong — proposed fix
[P1] Important — ...
[P2] Polish — ...
```

Grouped by the 7 tracks above, with a final "Recommended fix order" section. Trivial fixes (broken link, missing label, typo, copy drift) applied inline during the audit; non-trivial fixes deferred to a follow-up build pass you approve.

## Out of Scope
- New features, new operatives, new integrations.
- Visual redesign (Cyber-Sentry design standard already locked).
- Migrations or schema changes unless a P0 data-integrity issue requires it.
- Multi-location (explicitly excluded).

## Estimated effort
- Audit pass: ~15–25 tool calls reading code + DB.
- Inline trivial fixes: small patches as found.
- Follow-up build pass: scoped after you approve the findings.
