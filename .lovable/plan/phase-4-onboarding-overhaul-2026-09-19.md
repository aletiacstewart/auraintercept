# Phase 4: Onboarding Overhaul

Three parts: a First Steps checklist that guides new customers, industry-specific
quick-start paths driven by the existing industry packs, and one integration page
replacing the seven separate connection pages.

## 4.1 First Steps checklist

A five-step welcome checklist shown right after signup. It never blocks the
dashboard — it opens once, can be closed at any time, and keeps nudging from a
progress card until it is finished or dismissed.

Steps (each links to the real screen that does the work):

1. **Your business type** — pick the industry; sets the company's industry pack.
2. **Connect your calendar** — Google Calendar, or skip.
3. **Set up calls, texts or email** — SignalWire phone number and/or Resend email sender.
4. **Add your team** — invite staff (skippable for solo operators).
5. **Try it out** — book a test appointment or create a test quote.

Finishing all five shows a short celebration and marks onboarding complete.
Progress is saved to the account, so it survives sign-out and can be resumed.
Each step can be skipped individually; skipped steps stay visible in the nudge
card so they can be picked up later.

The existing (currently unused) Fast Start wizard is removed, along with any of
its helper files nothing else uses. Its useful pieces — business-type picker,
website import, agent activation — are reused by the new steps where they fit.

## 4.2 Industry quick-start paths

The platform already carries 28 industry packs in the database with their own
wording, services, forms and specialists. Rather than a separate five-industry
list, each pack gains a quick-start section: recommended agents, the connections
that industry needs, a one-line "here's how it works for you" message, a sample
workflow, and which feature areas to show first.

That single source then drives: the First Steps content, the "recommended for
your industry" grouping on the integrations page, the agent suggestions in the
Agents hub, and the existing per-industry sidebar filtering.

## 4.3 One integrations page

`/dashboard/integrations` becomes the only connections screen, grouped as:

- **Essential** — Calendar, Calls & Texts (SignalWire), Email (Resend)
- **Recommended for your industry** — driven by the industry pack (e.g. Voice for HVAC)
- **Optional** — Stripe payments, ElevenLabs voice, Upload-Post social posting, CRM

Each card shows a plain status (Connected / Needs attention / Not connected),
what it is for, rough cost where the provider bills directly, a setup time
estimate, and buttons to connect, test or get help. Setup happens in a pop-up on
the same page instead of a separate page per provider. The web-research (Tavily)
connection is removed from the list.

The seven per-provider pages are deleted; their old links redirect here, as does
the current third-party overview page.

## Technical notes

- `src/contexts/OnboardingContext.tsx` wraps the existing `useSetupProgress`
  engine (derived signals + `company_setup_step_overrides`) and adds the five
  First Steps entries, skip handling and completion percentage. No dashboard
  gating: `canAccessDashboard` is always true; the context exposes
  `shouldPrompt` instead.
- `src/pages/Onboarding/FirstStepsChecklist.tsx` (full-screen dialog, wizard
  flow, per-step skip, confetti on finish) + `FirstStepsNudgeCard` on the
  dashboard. Auto-open is behind the existing `first_steps_onboarding_enabled`
  flag.
- Migration: `profiles` gains `onboarding_progress integer default 0`,
  `onboarding_skipped_at timestamptz`, `first_steps_state jsonb default '{}'`.
  No `business_type` column — industry lives on `companies`/industry pack.
  Existing RLS on `profiles` covers the new columns.
- Migration: `industry_template_packs` gains `quickstart jsonb default '{}'`
  (`recommended_agents`, `required_integrations`, `features_enabled`,
  `onboarding_message`, `sample_workflow`), then a data update populating all
  active packs.
- `src/lib/industryConfig.ts` holds defaults per cluster plus
  `resolveQuickstart(pack)`; `src/hooks/useIndustryConfig.ts` layers on
  `useIndustryPack` and exposes `config`, `isFeatureEnabled`,
  `recommendedAgents`, `requiredIntegrations`. Behind
  `industry_specific_paths_enabled` where it hides nav items.
- `src/lib/integrationConfig.ts` describes the real providers (google_calendar,
  signalwire_voice, signalwire_sms, resend_email, elevenlabs, stripe,
  upload_post, crm) with category, requiredFor, docs link, estimated time and
  pricing note. Third-party billing copy stays as-is: customer's own account and
  card, billed directly by each provider.
- `src/components/integrations/IntegrationCard.tsx` +
  `src/pages/Dashboard/IntegrationSetupWizard.tsx`. Credential forms, the
  Google Calendar OAuth flow, the Upload-Post panel and the carrier-forwarding
  guide are reused inside modals — no re-implementation of working save logic
  against `tenant_integrations` / `google_calendar_connections`.
- Deletions: `src/pages/integrations/{Voice,SMS,Email,Calendar,SocialMedia,Tavily,CRM}Integration.tsx`,
  `src/pages/Integrations.tsx` (folded into the wizard),
  `src/components/onboarding/FastStartWizard.tsx`. Redirects added in `App.tsx`
  for `/dashboard/integrations/*` and `/dashboard/3rd-party-overview`.
  Sidebar and quick-action links repointed to `/dashboard/integrations`.
- Verification: typecheck + build clean, no dangling references to deleted
  files, and the integrations page loads with correct connected/not-connected
  status for the signed-in company.
