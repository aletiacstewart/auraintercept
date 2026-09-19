# Full Platform Audit — Front and Back

A structured sweep of the whole platform: the AI agents, the documents and guides, and every dashboard screen. The work is split into phases so each one produces a clear list of findings and fixes rather than one giant pass.

## Phase 1 — AI agent audit (agentic behavior + wiring)

For every operative and every backend AI service (118 backend services, including the orchestrator, chat, voice, content, social, booking and notification services):

- Confirm each agent is reachable: it has a live backend service, the service is deployed, and the screen that launches it actually calls it.
- Confirm each agent is genuinely agentic where it should be: it can call tools/actions (booking, pipeline updates, sending messages, publishing) rather than only returning text.
- Confirm each agent receives the business context it needs: company profile, industry pack terminology, services, knowledge base, current date/time.
- Confirm handoffs between agents work (for example front desk to booking to reminders to review request).
- Flag any agent that is listed in the interface but has no working backend behind it, and any backend service no screen ever calls.
- Test a representative agent per category with a real request and read the response before calling it verified.

Output: a table of every agent with status (working / partially wired / not wired) and fixes applied.

## Phase 2 — Documents, PDFs and guides

Covers the ~16 generated PDFs, the platform guides, the export documentation page, video prompt/script packs, onboarding packets and the audit checklist.

- Check every document for stale pricing, stale plan names, stale agent counts, removed features and outdated third-party policy wording.
- Check each document still generates without error and that the download buttons are wired.
- Check the in-app guides match what the platform actually does today (Upload-Post as the social gateway, specialists on all plans, trial terms, non-refundable onboarding fee wording).

Output: list of corrections, applied directly.

## Phase 3 — Dashboards and navigation

For each dashboard (platform admin, company admin, employee, technician, customer portal) and each console page:

- Every card, button, tab and link goes somewhere real — no dead links, no buttons with no handler, no routes that 404.
- Every widget shows live data or a proper actionable empty state — no placeholder or mock data.
- Layout holds together at desktop and mobile widths; no clipped content or internal scrollbars outside the allowed chat area.
- Sidebar and header entries match the routes that actually exist and respect plan/role gating.

Output: per-screen findings, fixed as found.

## Phase 4 — Back-end health

- Scheduled jobs: confirm each one is scheduled, running, and not silently erroring.
- Integrations: phone/SMS, email, calendar, voice, payments, social publishing, AI gateway — confirm credentials resolve and a live call succeeds where it can be safely tested.
- Database: row-level security and access grants on every table used by the app; no table open to the public that shouldn't be.
- Review recent error logs across services and close or fix outstanding alerts.

## Phase 5 — Report

A single written summary at the end: what was checked, what was broken, what was fixed, and anything that stays blocked because it needs something from you (an account, a key, an inbox).

## Technical notes

- Verification is evidence-based: live invocations of backend services, real database queries, and browser-driven checks of dashboard screens — not code reading alone.
- Fixes are applied in the same pass when they're clearly in scope; anything risky or ambiguous is listed for your decision instead of changed silently.
- Known outstanding item carried in: the superadmin account password reset still needs a reachable inbox.
