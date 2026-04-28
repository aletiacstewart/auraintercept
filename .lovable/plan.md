# Platform Deep-Dive & Cleanup Sweep

Goal: every page, console, agent path, and integration screen reflects the current pricing/trial reality, runs on real data, and presents clean, consistent setup steps.

Pricing is locked at: **Core $197 · Boost $497 · Pro $997 · Elite $1,997**, **90-day free trial, no credit card**, **3rd-party usage bundled in tier (no extra fees)**.

---

## 1. Pricing & trial — close the leaks

Confirmed correct already: `Auth.tsx`, `Subscription.tsx` price tables, `Index.tsx`, `Help.tsx`, `Contact.tsx`, `ForBusiness.tsx`, `subscriptionAgentConfig.ts`, `documentationConfig.ts`, `WebsiteCopyPDF.tsx`, all 4 tier mappings in `create-checkout`.

Fix:
- `src/pages/Subscription.tsx` line 283 — trial progress bar still divides by **30**. Change to **90** so the "% used" reads correctly for 90-day trials.
- `src/components/documentation/WebsiteCopyPDF.tsx` line 493 — remove leftover legacy "Aura Express - $197/mo" entry (duplicates Core).
- `src/components/documentation/VideoScriptsPDF.tsx` lines 501 & 585 — replace "Aura Express at just $197/month" with "Aura Core at just $197/month".
- `src/components/documentation/PlatformDocumentPDF.tsx` line 587 — "within 30 days" stat copy is unrelated to trial; leave (it's a marketing claim about missed appointments).
- Re-confirm `trial-reminders` edge function copy says "90-day" not "30-day" (currently generic; leave wording but verify schedule cadence still fires at day 60/83/90 instead of 7/29/30 — update to a 90-day cadence: reminder at 30 days remaining, 7 days remaining, 1 day remaining, expired).

---

## 2. 3rd-party fee disclaimers — switch to "bundled"

Per your decision, every tier now **bundles** SignalWire SMS/voice, ElevenLabs minutes, Resend email, Tavily search at standard usage caps. Sweep these files and rewrite the disclaimer:

- `src/components/integrations/CostCalculator.tsx`, `CostCalculatorHelp.tsx`, `ROICalculator.tsx`
- `src/components/integrations/SignalWireSetupGuide.tsx`, `ElevenLabsSetupGuide.tsx`, `ElevenLabsVoiceSetupGuide.tsx`, `ResendSetupGuide.tsx`, `TavilySetupGuide.tsx`
- `src/pages/integrations/VoiceIntegration.tsx`, `SMSIntegration.tsx`, `EmailIntegration.tsx`, `TavilyIntegration.tsx`, `CalendarIntegration.tsx`
- `src/lib/howToUseContent.ts` (any "carrier fees apply" strings)
- Memory file `mem://legal/third-party-fee-disclaimer` and `mem://billing/transparency/third-party-cost-disclosure` — rewrite to the new bundled standard.

Standard line going forward:
> "Voice minutes, SMS, email and search usage are bundled in your subscription tier. We pass-through provider quality at no extra cost up to your tier allotment. Heavy overages (>10× tier average) may be reviewed."

---

## 3. Mock / fake data → real queries with actionable empty states

These widgets currently render `Math.random()` or hardcoded numbers. Rewire to live data and, when empty, show "No data yet — [primary action]" per the actionable-empty-state standard.

| File | Current issue | Fix |
|---|---|---|
| `src/components/ai/AIAgentConsole.tsx` line 561 | `totalSessions` = sum of random ints | Query `ai_conversations` for company_id, count last 30 days; show "0 sessions yet — Start a chat" if empty |
| Same file line 562-563 | `avgResponse: '< 1s'`, `satisfaction: '98.4%'` hardcoded | Pull from `ai_conversation_metrics` or compute from `ai_messages` timestamps; hide card when no rows |
| `src/components/ui/sidebar.tsx` line 536 | Random width for skeleton | OK — it's a skeleton placeholder, leave as-is |
| `src/pages/CyberSentryMockup.tsx` | Entire mockup file uses random | Already gated to platform_admin via memory; leave (it is an internal mock by design), but add header banner "Internal mockup — not live data" |
| `src/components/aura/charts/AuraLineChart.tsx` | Random gradient ID | OK — DOM uniqueness only |

Audit pass also for any console showing "$12,340" / "47 jobs" style hardcoded numbers — verified clean in: `BusinessOpsConsole`, `FieldOpsConsole`, `MarketingSalesConsole`, `SocialMediaConsole`, `AnalyticsConsole`, `BusinessManagementConsole`, `CustomerPortalConsole` (all delegate to live components).

---

## 4. Consoles — usability pass

For each of the 7 consoles + AI Hub, verify:
1. Header has `PageHeader` with `ValueBadge`, `HowToUseModal`, optional `InstallOnPhoneButton` for admins.
2. `WorkflowChainButtons` row present with at least 3 chains, all wired to real `aura-unified` actions (not toast-only).
3. `FeatureGate` wraps content with the correct `requiredConsole`.
4. No internal scrollbars (per Cyber-Sentry rule, except `max-h-[60vh]` chat).
5. Empty states are actionable.

`FieldOpsConsole` (sample reviewed) currently fires `toast.info('Workflow queued')` — **mock**. Rewire `onTrigger` to `useAuraCommand().run(cmd.command)` so the chain actually executes through the orchestrator. Apply the same fix to:
- `MarketingSalesConsole`, `SocialMediaConsole`, `BusinessManagementConsole`, `CustomerPortalConsole`, `AnalyticsConsole`, `CreativeWebPresenceConsole` (search for `toast.info('Workflow queued')`).

---

## 5. AI agent handoffs — verify every chain is real

`src/hooks/useMultiAgentChat.ts` and `useBrowserVoiceChat.ts` already implement `handoff_to` follow-up calls. Verify each agent in `EVENT_ROUTING` (`supabase/functions/ai-agent-chat/index.ts`) returns a valid `handoff_to` for the documented events, and add tests for any gaps. Concretely:
- triage → booking, lead, dispatch, billing
- booking → followup, review
- dispatch → route → eta → checkin
- lead → outreach → campaign
- creative_content → social_scheduler → social_analytics

Any chain that responds with a `handoff_to` that isn't in the company's tier agent list must fall back gracefully (currently throws). Add a tier-aware filter that downgrades to triage and surfaces an "Upgrade tier to unlock X" toast.

---

## 6. Integrations — setup-step truthing

For each integration screen, re-check requirements against current provider docs and clean copy:

| Integration | Current setup | Verified action |
|---|---|---|
| **Voice (ElevenLabs)** | API key + agent ID | Confirm dashboard tools list per `mem://features/integrations/elevenlabs-client-tools-dashboard-config`. Fine. |
| **SMS/Voice (SignalWire)** | Project ID, API token, phone number | Update SignalWireSetupGuide: "$5 free trial credit" line is stale — provider now offers $0 self-serve plan. Replace with "Sign up at signalwire.com (no credit card to start)". |
| **Email (Resend)** | API key + verified domain | OK. Add "We bundle 5,000 sends/mo per tier" line. |
| **Tavily** | API key | OK. Add "1,000 searches/mo bundled". |
| **Google Calendar** | OAuth | Confirm origins/redirect URIs match `mem://architecture/google-calendar-oauth-setup-requirements`. |
| **Social Media** | Manual Bridge default + Own API advanced | Remove the "Coming Soon" banner (`SocialMediaIntegration.tsx` lines 408-414) — Manual Bridge IS the shipping path; the banner is misleading. Replace with a green "Active — Manual Bridge enabled by default" badge. |
| **Stripe** | Platform-managed | OK. |

---

## 7. Memory updates

After the sweep, update:
- `mem://legal/third-party-fee-disclaimer` → bundled-in-tier wording.
- `mem://billing/transparency/third-party-cost-disclosure` → mark cost-acknowledgement modals as removed for SMS/voice/email/search; keep only for paid add-ons (none currently).
- `mem://features/web-presence/console-feature-visibility-controls` → no change.
- New memory `mem://product/trial-period-standard` → "90-day free trial; progress bar divides by 90; reminders at day-30-remaining, day-7-remaining, day-1-remaining, expired."

---

## Files to change (approx. 35)

Frontend pages: `Subscription.tsx`, `SocialMediaIntegration.tsx`, `VoiceIntegration.tsx`, `SMSIntegration.tsx`, `EmailIntegration.tsx`, `TavilyIntegration.tsx`, all 7 console pages under `src/pages/ai-consoles/`.

Components: `AIAgentConsole.tsx`, `CostCalculator.tsx`, `CostCalculatorHelp.tsx`, `ROICalculator.tsx`, `SignalWireSetupGuide.tsx`, `ElevenLabsSetupGuide.tsx`, `ResendSetupGuide.tsx`, `TavilySetupGuide.tsx`, `WebsiteCopyPDF.tsx`, `VideoScriptsPDF.tsx`.

Edge functions: `ai-agent-chat/index.ts` (tier-safe handoff fallback), `trial-reminders/index.ts` (90-day cadence).

Memory: 3 files updated, 1 new.

No DB migrations required — schema already supports 90-day trials and 4 tiers.

---

## Risk & rollback

- All changes are copy/UI/wiring. No destructive SQL.
- Handoff fallback is additive (try-catch around current throw).
- Each console toast→aura-command swap is independently revertable.
- I'll commit in logical batches (pricing → 3rd-party copy → mock-data → handoffs → integrations) so any single batch can be rolled back via version history.

Approve and I'll execute the sweep top-to-bottom.