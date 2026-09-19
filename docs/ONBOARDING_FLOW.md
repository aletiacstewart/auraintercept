# Onboarding flow

## Principle

First Steps never blocks anything. A new owner lands on a working dashboard; the checklist is a card with progress that they can open, skip step by step, or hide.

## The five steps

| Step | Counted as done when |
| --- | --- |
| Tell us what your business does | `companies.industry_vertical` is set |
| Connect your calendar | a `google_calendar_connections` row with `sync_enabled` |
| Turn on calls, texts and email | SignalWire or Resend present in `tenant_integrations` |
| Add your team | more than one profile in the company |
| Try it once | any appointment or quote exists |

Every step is derived from live data — nothing is "marked complete" by hand, so the list stays honest if a connection is later removed.

## Where state lives

`profiles.first_steps_state` (jsonb: `skipped[]`, `dismissed`, `celebrated`), `profiles.onboarding_progress` (0–100), `profiles.onboarding_skipped_at`.

Provider: `src/contexts/OnboardingContext.tsx`. UI: `FirstStepsNudgeCard` on the company dashboard opens `src/pages/Onboarding/FirstStepsChecklist.tsx`. Auto-open sits behind the `first_steps_onboarding_enabled` flag.

## Industry quickstart

`industry_template_packs.quickstart` supplies the recommended agents, required connections, welcome wording and day-to-day example per business type. Cluster fallbacks live in `src/lib/industryConfig.ts`; `useIndustryConfig()` is the only read path.

## Measurement

`src/lib/analytics.ts` writes to `onboarding_analytics`. Events: `onboarding_started`, `onboarding_step_completed`, `onboarding_step_skipped`, `onboarding_finished` (with `durationMinutes`), `first_booking_created`, `first_quote_created`, `first_agent_enabled`, `integration_connected`. Each milestone is reported once per browser (localStorage guard) so re-visits do not inflate counts, and a failed write is logged and swallowed.

Admins read it at `/dashboard/admin/onboarding`: started vs finished, completion rate, typical time to finish, first action reached, and a per-step completed/skipped chart.

## After the checklist

The Shepherd product tour (`src/components/onboarding/ProductTour.tsx`) offers a walk through the menu; completion is stored per role in localStorage and can be replayed from the AI Help Center panel.
