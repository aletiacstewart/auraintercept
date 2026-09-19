# Remaining work document: checked, then the real gaps closed

I went through the uploaded document item by item against the live project. Most of the "unknown" items are already built. Below is what I confirmed, then what still needs doing.

## Already in place (verified, no work needed)

- **Agent hub** — discovery cards with what-it-handles lists and "Needs calendar / sms" badges, Learn More + Enable, expandable member agents with switches; My Agents status cards with interactions, success rate, average time and a menu (settings, performance, pause/resume, test); Performance tab with real 30-day metrics.
- **Ready-made agent wording library** — two tones per job, live preview, apply, edit, reset.
- **Connection health automation** — nightly sweep plus an on-demand "Check now", real probes for Google Calendar, calls & texts, email, voice, payments and message-campaign registration, all recorded to history and shown on the Health tab.
- **Voice key handling** — format checks with plain-English errors, including the "that's the key ID, not the key" case.
- **Empty-state guidance** and the **product tour** exist.
- Five of the eight documents exist (architecture, features, agents, navigation map, connections).

## What is genuinely missing (the work to do)

### 1. Business-type filtering in the side menu
Right now the menu filters by plan level, staff role and a few per-industry rules, but it does not use the business-type feature list. Change:
- Menu items gain an optional business-type requirement (scheduling, quotes, invoicing, inventory, marketing/leads, field work).
- Items the business type doesn't use are hidden outright, as the document specifies. Plan-level and role rules still apply on top.
- The menu gets a heading naming the business type, e.g. "HVAC dashboard".
- Owners and platform admins are never filtered out of their own settings, billing, connections or agents.

Note: hiding fully means an HVAC company stops seeing Inventory and a cleaning company stops seeing Quotes and Invoices even though their plan includes them. If that turns out to be too blunt in use, adding a "show everything" link later is a small change.

### 2. Onboarding measurement
- New `onboarding_analytics` table (who, which company, what happened, extra detail, when) with access rules: a company sees its own rows, platform admins see all; the app can write its own rows.
- A small tracking helper recording: checklist started, each step finished, each step skipped, checklist finished (with minutes taken), first booking, first quote, first agent switched on, connection made.
- Wire it into the First Steps checklist, the booking and quote creation paths, agent activation and the connections screen.
- New admin-only page **Onboarding** under Admin in the menu: completion rate within 48 hours, average time to finish, which steps get skipped most, and a trend chart. Built from the same charting style as the rest of the dashboard.

### 3. Agent Enable blocked when a connection is missing
Enable is currently only limited by plan and permission. Add: if a job needs a connection the company hasn't set up, Enable is disabled with "Connect calls & texts first" and a link straight to that setup.

### 4. The three missing documents
- **VOICE_SETUP.md** — getting the ElevenLabs key, saving it, testing, troubleshooting, costs.
- **ONBOARDING_FLOW.md** — how First Steps works, where progress is stored, how to change the steps.
- **DATABASE.md** — main tables, how company separation works, the access-rule pattern.

### 5. Housekeeping
- Remove the stale internal audit note claiming health checks only cover calendar and calls/texts — they cover six now.
- Update roadmap.md to tick off the confirmed items and add the new ones.

## Technical notes

- `NavItem` gains `requiredFeature?: FeatureKey`; `DashboardSidebar` calls `useIndustryConfig()` and filters on `isFeatureEnabled`, skipping while the pack loads so nothing flickers. Platform admin bypasses as today. `industryNavVisibility` rules stay and stack.
- New table follows the standard four steps (create, GRANTs, enable row-level security, policies) with indexes on `(company_id, event_type, created_at desc)` and `(user_id, created_at desc)`.
- `src/lib/analytics.ts` exports `trackOnboardingEvent` plus the convenience helpers; failures are logged, never thrown, so tracking can't break a flow.
- New page `src/pages/admin/OnboardingAnalytics.tsx` at `/dashboard/admin/onboarding`, platform-admin gated, Recharts, kept under 300 lines by splitting stat cards into a small component.
- Enable-gating reads existing connection status from `useIntegrationHealth` / tenant connection records mapped to each job's `requiredIntegrations`.

## Verification

- Typecheck and build clean.
- Click through the menu as an HVAC-type and a booking-type company and confirm the difference.
- Confirm an event row lands when a checklist step is completed, and that the Onboarding page renders with and without data.
- Check the new page at phone width.
