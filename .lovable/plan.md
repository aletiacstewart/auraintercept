# Full Platform Audit — Agents, Features, Automations

Goal: produce a single prioritized findings report covering everything that's declared, promised, or half-wired but not fully live. Output lands in `.lovable/audit-2026-07-10.md` and updates `src/lib/auditFindings.ts` so the in-app `/audit` surface reflects the new run.

## Scope

1. **AI Agents / Operatives (24-agent model)**
   - Cross-check `src/lib/subscriptionAgentConfig.ts` operative roster against actual routes in `src/pages/ai-consoles/*`, `src/pages/operations/*`, and technician consoles.
   - Flag operatives with no console entry, no system prompt, no metrics wiring (`useConsoleAgentMetrics`), or no handoff route in `EVENT_ROUTING`.
   - Verify Specialist Operatives (14) each have industry-pack activation + prompt injection.

2. **Automations (cron + triggers + edge functions)**
   - Enumerate every `supabase/functions/*` and check: has cron OR trigger OR user-invoked call site? Orphans = candidates.
   - Cross-check `.lovable/plan.md` "live cron/triggers" list against actual `cron.job` rows and `pg_trigger` entries via `supabase--read_query`.
   - Look for manual-only "Sync Now" / "Send Now" / "Run Now" buttons that should be scheduled.

3. **Features declared in memory but missing/partial in code**
   - Walk `mem://index.md` core rules + memory files, spot-check each against implementation (e.g. staff notification 4 channels, missed-call retry, campaign series dispatch, launch pricing toggle, industry pack coverage for all 28 packs, PWA scope rules, tier-gated widgets).
   - Confirm every industry pack has: quote_template, invoice_template, empty states, KPI labels, prompt delta, role preview.

4. **Onboarding & Setup**
   - Fast-Start wizard → tier redirect, Guided Launch 4-state machine, ElevenLabs client tools config, Google OAuth manual steps, 10DLC signup step, welcome email trigger.
   - Any setup checklist items with no completion writer.

5. **Customer-facing (Aura chat, voice, SMS, booking, portal)**
   - Verify hashtag SMS auto-responder, missed-call retry loop, bilingual auto-translate, unified booking 14-day scan, customer portal unification, public company listing RPC.
   - Chat widget install methods (3), voice greetings per industry, review request post-call hook.

6. **Field ops & dispatch**
   - Auto-dispatch trigger fires for `auto`/`hybrid` modes; technician click-to-call; service-aware workflow (physical vs virtual); mobile FAB; PWA scope; inventory low-stock alert.

7. **Marketing, content & analytics**
   - Content Engine unified flow, social 3-tab console, weekly social batch cron, campaign series dispatch, blog auto-generation, analytics weekly run + proposed actions write path, NLP analytics interface, 8-tab dashboard suite.

8. **Settings & integrations**
   - Every integration (SignalWire, ElevenLabs, Resend, Tavily, Stripe, A2P 10DLC, Upload-Post, Google Cal, CRM providers): status check, health-check coverage, third-party disclaimer copy, tier lock/unlock badges.

9. **Tier gating & billing**
   - Launch pricing toggle behavior, LEGACY_TIER_MAP grandfathering, onboarding_price_id TODO (still pointing at old 50% prices per memory), 3rd-party cost disclosure prompts, trial 60-day math.

10. **Cross-cutting hygiene**
   - RLS + GRANTs on every public table (spot-check recent migrations).
   - Edge functions returning `200 OK` wrapper on subscription checks.
   - Console theme token usage (no raw hex outside marketing/dark surfaces).
   - Canonical naming registry, no "Control Centers" / "enterprise" / "starter/connect" drift.

## Method

- Spawn 4 parallel `acp_subagent--explore` background tasks, one per major bucket (Agents+Automations, Features+Onboarding, Customer+FieldOps, Marketing+Settings+Billing+Hygiene). Each returns structured findings with `file:line` refs, severity (P0–P3), fix size (S/M/L), and status.
- Run targeted DB reads via `supabase--read_query` for: `cron.job`, `pg_trigger` on flagged tables, `pg_policies` sampling, and orphan `public.agent_proposed_actions` cooldown state.
- Merge into a single ranked list. Nothing gets fixed in this pass — audit only.

## Deliverables

- `.lovable/audit-2026-07-10.md` — full narrative report grouped by area with counts, severity distribution, and a "Top 10 to fix next" section.
- Updated `src/lib/auditFindings.ts` with new `AuditFinding` entries (status: `open`) so `/audit` shows the current state.
- Chat summary: totals per severity, top gaps by area, recommended next slice to implement.

## Out of scope

- Any code fix or migration — audit-only run.
- Multi-location work (excluded per memory).
- Re-verifying findings already marked `fixed` or `false_positive` in the existing `auditFindings.ts` unless a new signal contradicts them.
