# Full-Platform Consistency & Compliance Audit

This is a large, read-only sweep across the entire app. No code changes in this pass — I'll produce a single findings report grouped by severity, then we decide what to fix (and in what order) in a follow-up.

## Scope

### 1. Industry-specific compliance & setup (28 packs, 5 clusters)
- For each `industry_template_pack` row: verify `terminology`, `service_catalog`, `customer_intake_schema`, `quote_template`, `invoice_template`, `appointment_rules`, `agent_prompt_deltas`, `extra_operatives`, `min_tier_per_extra`, `console_visibility` are all populated and internally consistent.
- Verify `hasFieldTechnicians` / `usesQuotes` / `usesLeads` / `usesInventory` / `usesAppointments` / `usesCompaniesB2B` (in `src/lib/industryCapabilities.ts`) match each pack's actual config.
- Cross-check: `industryEmptyStates`, `industryNavLabels`, `industryKpiLabels`, `industryFieldLabels`, `industryQuickActions`, `industryHelpContent`, `industryWorkflows`, `industryReportTemplates`, `industryPortalCopy`, `industryRolePreview`, `industryVoiceGreetings`, `industryFastStartQuestions`, `industryAnalyticsPresets` — flag any industry missing entries.
- Verify prompt-delta injection (per `industry-prompt-injection-standard`) actually fires in every operative edge function.

### 2. Consoles & dashboards
- Walk every console: Marketing/Sales, Field Ops, Business Mgt, Customer Portal, Social Media, Specialist Operatives, Analytics, Content Engine, Receptionist, Pipeline, Appointment, Custom, Technician, Customer-facing.
- Confirm: industry pack drives copy, empty states are actionable (not "no data"), tier locks render correctly, plain-English agent labels (Front Desk / On The Way / Billing) are used, no mock data, temporal context wired.
- Verify CompanyAdminDashboard Simple/Pro toggle and 8-group sidebar still match `sidebar-simplification-v1`.

### 3. AI agents / operatives (24 → 10 operatives)
- Confirm `TIER_AGENTS` in `initialize-company-agents` matches `subscriptionAgentConfig.ts` and `twenty-four-agent-model-standard`.
- Verify every operative's edge function: industry prompt delta injected, temporal context injected, internal-service auth (`verify_jwt=false` where required), 200-OK wrappers on subscription failures.
- Spot-check agent handoff logic (`EVENT_ROUTING`) and Aura voice navigation actions.

### 4. Pricing, billing, trial (4-tier model)
- Every surface that prints prices: homepage, ForBusiness, Pricing card on signup, Subscription page, Calculators, Outreach Toolkit PDFs, "See more details" modals, Stripe checkout (`create-checkout/index.ts`), legacy-tier map, in-app upsell prompts.
- Confirm: Core $697/$349, Boost $1,097/$549, Pro $1,997/$999, Elite $3,497/$1,749 (onboarding = 50% of monthly, rounded).
- Confirm: 90-Day Live Trial wording + onboarding-fee-due-at-start + `(90 - daysRemaining)/90` progress math (per memory). Flag any 60-day or other variants.
- Verify legacy tier aliases (`starter/connect/performance/command` ↔ `core/boost/pro/elite`) resolve consistently in checkout, agent init, subscription check, and UI gating.

### 5. 3rd-party setup & fee disclosure
- For each provider (SignalWire, ElevenLabs, Resend, Tavily, Stripe, A2P 10DLC, Google OAuth, Social OAuths): verify the setup wizard, integration page, and Concierge Onboarding copy all say "customer's own account + card on file, invoiced separately."
- Hunt for any "bundled / overage / absorbed / included usage" language and flag it (forbidden per memory).
- Verify required disclaimers (`legal/third-party-fee-disclaimer`) appear before any provider-cost-triggering action.

### 6. Docs, guides, homepage, signup, marketing
- Homepage, About, ForBusiness, Contact, Audit, OpportunityAudit, AIAgentGuide, IntegrationDocs, blog content, video toolkit copy, outreach PDFs.
- Signup flow: pricing structure presentation, 10DLC legal step, Google auth, no anonymous signup, no auto-confirm email.
- Help center + AIHelpCenter prompts — verify they reference the 4-tier model and correct trial length.

### 7. Functional smoke tests
- Run existing Vitest suite (`bunx vitest run`) — flag failures.
- Browser-check the Marketing/Sales console (user's current route) for runtime errors.
- Spot-check key edge function logs (`send-campaign`, `voice-incoming`, `sms-webhook`, `initialize-company-agents`, `create-checkout`, `check-subscription`) for recent errors.
- Run security scan + db linter.

### 8. Cross-cutting inconsistency hunts
- Forbidden: hex/rgba in components (Cyber-Sentry rule), CRM/Warranty references, multi-location UI, mock data, Lovable preview URLs in API calls (must be `auraintercept.ai`).
- Naming: 24-agent → 10-operative mapping consistent everywhere.
- Console routes match `console-route-standardization`.

## Deliverable

A single grouped report:
- **P0 — Broken / wrong info shown to customers** (wrong price, wrong trial length, missing 3rd-party disclosure, broken console)
- **P1 — Inconsistent / stale** (industry pack missing fields, legacy tier name leaked, etc.)
- **P2 — Polish / nits**

Each finding: file:line + suggested fix. No code edits in this audit — fixes go into a follow-up plan you approve.

## Estimated effort

This is a wide sweep — I'll lean heavily on parallel subagent investigations (industry packs, pricing, 3rd-party copy, edge functions, tests) to keep it efficient. Expect the report to be long.

## One question before I start

Want me to **also run the Playwright visual tests** (`tests/visual/`) as part of the smoke test, or skip those and stick to Vitest + edge-function logs + security scan? Playwright will take longer and sometimes flakes on theme/contrast checks.
