# Phase 7: Guidance, Connection Health, Ready-Made Agent Prompts

Three additions that make empty screens useful, show whether each connection is actually working, and let people pick an agent's wording instead of writing it.

## 7.1 Empty screen guidance

A reusable guidance block for screens with no data yet: heading, short explanation, up to three quick tips, and one clear button. Optional walkthrough-video link is supported in the code but left unused for now.

Rolled out on the screens most likely to be empty for a new account: Leads, Customers, Appointments/Schedule, Invoices, Quotes, Marketing campaigns, Inventory. Each gets wording and a button that matches the screen (for example Leads: "Import leads", with tips about uploading a spreadsheet, syncing a CRM, or adding one by hand).

The existing industry-aware empty state stays as-is; the new block is used where there is no industry-specific copy.

## 7.2 Connection health

Adds a **Health** tab to the existing Connections page (no new menu item).

For every connection the company has, the tab shows: status (working / needs attention / not connected), when it last worked, the most recent error in plain English, a reliability percentage over the last 30 days, and a "Check now" button that re-tests everything on demand.

Health results are recorded over time so the percentage and history are real rather than a one-off guess. The nightly checker that already exists starts writing its results into that history too, so the tab fills in automatically.

## 7.3 Ready-made agent prompts

A library of pre-written instructions for each agent job — two tones each, professional and friendly — covering scheduling, lead follow-up, customer support, dispatch/field work, billing, and marketing. Company name, industry and services are filled in automatically.

In the agent setup window's wording step, people pick a tone from the library with a live preview and one click to apply, then edit freely. A "Reset to template" option restores the picked version.

## Technical notes

- `src/components/shared/EmptyStateGuide.tsx` — props: title, description, action {label, href, icon}, optional tips[], optional videoUrl. Design tokens only, no hardcoded colors.
- New table `integration_health_logs` (company_id, integration_name, status check in connected/error/degraded, last_sync, error_message, success_rate, checked_at) with GRANTs for authenticated/service_role, RLS: read own company, write service_role only; index on (company_id, integration_name, checked_at desc).
- New edge function `check-integration-health`: on-demand per-company probe of tenant_integrations + google_calendar_connections, writes a row per integration, returns the unified payload. JWT validated in code; reuses probe helpers extracted from `integration-health-check`, which is updated to log its nightly results to the same table.
- `src/components/integrations/IntegrationHealthTab.tsx` mounted as a tab in `src/pages/Dashboard/IntegrationSetupWizard.tsx`; `useIntegrationHealth` hook for fetch + manual re-check.
- `src/lib/agentPrompts.ts` — `AGENT_PROMPTS` keyed by job type then tone, with `[COMPANY_NAME]` / `[INDUSTRY]` / `[SERVICES]` placeholders and a `renderAgentPrompt()` helper; consumed by the Prompt step of `AgentConfigModal.tsx`.
- Verification: typecheck, build, and a Playwright pass over the Connections page and one empty-state screen.
