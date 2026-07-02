# Settings Hub & Platform Dashboard Fixes

Scope: copy + presentation fixes on Settings tabs and the Platform Admin Dashboard. No schema, no auth, no billing changes.

## 1. Twilio → SignalWire copy sweep (CRITICAL)

Replace user-facing "Twilio" copy with "SignalWire" everywhere it describes our telephony vendor. Keep code that talks to the actual Twilio REST API (staff SMS fallback), keep DB column names, keep the SignalWire signature file's Twilio-compat header comment.

User-facing text to update:
- `src/components/company/ReminderSettings.tsx` — "Twilio and ElevenLabs integrations" → "SignalWire and ElevenLabs integrations" (both the toast at ~L160 and body copy at ~L345). This is the exact bug the user cited.
- `src/lib/featureTooltips.ts` — voice/SMS/voice-call tooltips (L15, L29, L39) reword Twilio → SignalWire; rename the `twilio` entry in the integrations map (L109-110) to `signalwire` and update its `label`. Grep callers of `INTEGRATIONS.twilio` and update the key.
- `src/pages/SmartWebsiteManager.tsx` L1026 tooltip.
- `src/components/ai/chat/AgentHowToGuide.tsx` L109, L155.
- `src/components/ai/SMSChat.tsx` L126 "Send SMS via Twilio" → "Send SMS via SignalWire".
- `src/components/ai/TestCallDialog.tsx` L125-146 — the "Twilio trial account" error path is dead copy for SignalWire; reword to "SignalWire trial number not verified" or generic "This number isn't verified on your telephony account yet."
- `src/components/onboarding/GoLiveTimeline.tsx` L89-90 — `label: 'Connect Phone (SignalWire)'`; keep the `key: 'twilio'` only if changing it breaks stored progress — otherwise rename key too and add a one-line migration comment.
- `src/components/onboarding/CompanyOnboardingForm.tsx` — rename the `twilio` field label at L956 to "SignalWire" (keep the object key if it maps to persisted onboarding state; only rename the display name).
- `src/components/integrations/CostCalculatorHelp.tsx` L123 + `src/components/integrations/CostCalculator.tsx` L301 — rename the local `twilioCost` variable to `signalwireCost` for consistency (already computed from SignalWire pricing).

Also re-check onboarding workbook PDF, AI Opportunity Audit PDF, and any Help/PlatformGuides copy for stray "Twilio" strings via `rg -i twilio src/` after edits; only actual Twilio API-integration code (staff SMS in `send-staff-notification`) should remain.

Verification: `rg -i twilio src/` returns only DB type strings, the staff-SMS Twilio API call, and the SignalWire-signature Twilio-compat comment. Add a `contentDriftGuard` rule that fails if any `.tsx` under `src/pages` or `src/components` matches `/Twilio/` outside an allowlist.

## 2. Platform Dashboard — demo company data

In `PlatformAdminDashboard.tsx` Company Breakdown table: detect demo companies (`name ILIKE 'Demo %'` or the `demo_trials`/registry flag) and render a small "Demo Data" pill next to the company name. Also add a subtle section-level caption under the Company Breakdown heading: "Rows tagged Demo Data are seeded fixtures, not live tenant metrics." No numeric randomization — labeling is safer than fake variance.

## 3. Overall Setup Progress — 0/0 empty state

Where the Platform Dashboard renders "Overall Setup Progress", branch on `steps.length === 0` (or denominator === 0): render an inline empty state "Setup checklist not yet configured for this workspace" instead of the 0% progress bar. Keep the widget mounted so layout doesn't shift.

## 4. Lead Conversion — "Not yet tracked" state

Locate the Lead Conversion tile in `PlatformAdminDashboard.tsx`. If either (a) there is no `converted_at`/conversion event column being queried, or (b) the numerator is 0 while leads > 0 and customers > 0, render the tile value as "Not yet tracked" with muted styling and a small tooltip: "Lead-to-customer conversion events aren't wired up yet." Leave Quote Conversion and Appointment Completion unchanged.

## 5. Persistent spinner on Settings tabs

On Settings tabs (Company, Communications, Templates, Campaigns & Reviews) the top-level loader keeps spinning after content loads. Audit the Settings page wrapper (`src/pages/Settings.tsx`) and the tab shells: look for a parent `isLoading` that ORs multiple queries and never flips false because one query has no data / stays `isFetching`. Fix by:
- Scope the spinner to the specific card/section that owns the query (skeletons inside each card), OR
- Change parent gate from `isLoading || isFetching` to `isLoading` only (initial load), so background refetches don't retrigger the top spinner.

Verify by loading each tab and confirming spinner clears within 1s of first paint.

## 6. Appointments count mismatch — Customer Preferences empty state

`CustomerPreferences` empty state currently reads "No appointments found — Showing 0 of 0 appointments." Update the copy to include the active company name: "No appointments for {companyName} yet." Pull `companyName` from `useCompanyProfile()`. This clarifies scope vs. the platform-wide Snapshot count. No data-fetch change.

## 7. Platform Snapshot — group into 3 clusters

In `PlatformAdminDashboard.tsx`, wrap the 11 `MetricCard` tiles into three labeled `<section>` blocks, each with a small `text-xs uppercase tracking-wide text-muted-foreground` header:
- **Growth** — Total Companies, Total Users, Customers, Leads
- **Revenue** — Platform Revenue, Monthly Revenue
- **Operations** — Appointments, Pending Quotes, Inventory, Active Campaigns, AI Agents Active

Keep existing `MetricCard` styling and grid classes; only add the group headers and split the grid. Responsive: each group is its own `grid grid-cols-2 md:grid-cols-4` (Revenue group uses `md:grid-cols-2`).

## 8. Missed Call Follow-up default

Confirmation-only. Grep `missed_call_action` default in `companies` schema + `ReminderSettings` initial state. If default is not `enabled` at the DB or UI layer, flip the UI default toggle to on for new accounts (client-side default only — no migration to backfill existing rows). If already enabled by design and just displays "Disabled" until user saves, add clarifying helper text "Enabled by default on all plans — configure the follow-up action below." No further action.

## Technical notes

- Files touched (est.): 12 component/lib files, 0 migrations, 0 edge functions.
- Regression coverage: extend `src/lib/__tests__/contentDriftGuard.test.ts` with a "no user-facing Twilio" rule and a "Platform Snapshot grouping" snapshot check.
- Post-change verification: `rg -i twilio src/pages src/components`, `tsgo`, manual load of `/dashboard` as platform_admin and `/settings?tab=communications` as company_admin.

## Out of scope

- Real lead-conversion tracking pipeline (item 4 is a label fix, not a data fix).
- Randomizing demo-company metrics (item 2 is a label fix).
- Any schema, RLS, edge function, or billing changes.
