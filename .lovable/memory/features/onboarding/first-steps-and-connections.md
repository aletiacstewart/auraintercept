---
name: First Steps onboarding + unified Connections page
description: Phase 4 standard — First Steps checklist (never blocks dashboard), industry quickstart on packs, single /dashboard/integrations page
type: feature
---

## First Steps (replaces Fast Start)
- `src/contexts/OnboardingContext.tsx` (mounted in App under LanguageProvider) derives 5 steps from live data: industry set, Google Calendar connected, SignalWire/Resend present, >1 profile in company, any appointment or quote.
- Progress persists on `profiles.first_steps_state` (jsonb: skipped[], dismissed, celebrated), `onboarding_progress`, `onboarding_skipped_at`.
- Never gates the dashboard. `FirstStepsNudgeCard` on CompanyAdminDashboard opens `src/pages/Onboarding/FirstStepsChecklist.tsx`; auto-open only behind flag `first_steps_onboarding_enabled`.
- FastStartWizard.tsx deleted. `industryFastStartQuestions.ts` stays (used by BusinessContextManager).

## Industry quickstart
- `industry_template_packs.quickstart` jsonb = { features_enabled, recommended_agents, required_integrations, onboarding_message, sample_workflow }, populated for all 28 active packs by cluster.
- `src/lib/industryConfig.ts` holds cluster fallbacks + `resolveQuickstart`; `src/hooks/useIndustryConfig.ts` exposes config, isFeatureEnabled, recommendedAgents, requiredIntegrations. Packs stay the single source of truth — no parallel hardcoded industry list.

## Connections
- `/dashboard/integrations` (`src/pages/Dashboard/IntegrationSetupWizard.tsx`) is the ONLY connections screen. Groups: Essential (Calendar, Calls & Texts, Email), Recommended for your industry (pack-driven), Optional (ElevenLabs, Stripe, Upload-Post, CRM).
- Setup happens in pop-up modals reusing existing components: GoogleCalendarSettings / CalendarSubscription / CalDAVSubscription, SignalWireSetupGuide, ResendSetupGuide, ElevenLabsSetupGuide, UploadPostPanel, CrmConnectionsPanel (extracted from the deleted CRM page).
- Deep link `?open=<integration id>`; old routes (`/dashboard/3rd-party-overview`, `/dashboard/integrations/{voice,sms,email,calendar,social,tavily,crm}`) redirect here. Tavily removed everywhere.
- Deleted: src/pages/Integrations.tsx and all src/pages/integrations/* pages + index.ts.
