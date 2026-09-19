# Phase 1: Foundation & Cleanup

Three pieces: remove the dead admin screens, add a feature-flag switchboard, and publish a plain-English guide to the agent line-up.

## 1.1 Remove dead admin screens

Delete these screens, their routes, and their sidebar/dashboard links:

- Design Preview
- Cyber-Sentry Mockup
- Cyber-Sentry Portal Mockup
- Platform Brief export
- Architecture map
- Pack Coverage
- Calculators (also removes the Calculators shortcut on the owner dashboard)
- Platform Issues

Kept, per your answers:

- Public status page at `/status` and the Platform Health screen that edits it — both stay.
- Live Demo Superadmin — stays, it is the one-click demo sign-in.
- Platform Guides — stays, but is locked to platform admin only (today its route is open to any signed-in user even though the sidebar link is admin-only). It also hosts the documentation export and video prompts, so those keep working.

Also cleaned up: the guided-tour steps that point at the removed Calculators, Platform Issues and Architecture links, so the tour doesn't stop on missing buttons.

## 1.2 Feature flag system

A new `feature_flags` table plus a `useFeatureFlags()` hook so features can be switched on per company, or rolled out to a percentage of companies, without a redeploy.

Initial switches, all created off except where noted:

- `unified_analytics_enabled`
- `new_agent_hub_enabled`
- `first_steps_onboarding_enabled`
- `industry_specific_paths_enabled`
- `new_integration_wizard_enabled`

Rules: a row with no company attached is a global default; a row for a specific company overrides it. Only platform admins can change flags; every signed-in user can read the ones that apply to them. A flag decision is taken once per session so the interface doesn't flip while someone is using it.

Nothing in the app changes behaviour yet — this phase only installs the switchboard and the flags. Wiring screens to the flags happens when those new screens are built.

## 1.3 Agent reference layer

A new reference file grouping the platform's existing agents into five plain-English job types — Appointment Scheduler, Lead Qualifier, Customer Service, Field Operations, Follow-Up — each with what it does, which connected services it needs, and which industries it suits, plus per-industry starter sets (HVAC, plumbing, electrical, cleaning, automotive, general service).

This is descriptive only. Every one of the 24 existing agents keeps working exactly as it does now; the five types map onto them rather than replacing them. A matching written document explains when to use each type and which setup each one needs.

## Technical notes

- `src/App.tsx`: drop the lazy imports and `<Route>` entries for the eight removed pages; wrap `/dashboard/platform-guides` in `requiredRole="platform_admin"`.
- Delete `src/pages/DesignPreview.tsx`, `CyberSentryMockup.tsx`, `CyberSentryPortalMockup.tsx`, `Architecture.tsx`, `Calculators.tsx`, `PlatformIssues.tsx`, `src/pages/dashboard/PlatformBrief.tsx`, `src/pages/admin/PackCoverage.tsx`, and `src/lib/platformBrief.ts` if unreferenced elsewhere.
- `src/components/dashboard/DashboardLayout.tsx`: remove the Calculators, Platform Issues, Architecture and Platform Brief nav items and their `data-tour-id` branches. `src/components/dashboard/CompanyAdminDashboard.tsx`: remove the Calculators quick action. `src/components/tutorial/tutorialSteps.ts`: remove the three orphaned steps.
- Migration: `public.feature_flags (id, flag_name, enabled, rollout_percentage, company_id nullable, description, created_at, updated_at)`, unique on `(flag_name, company_id)`, indexes on `company_id` and `flag_name`, `GRANT SELECT` to `authenticated` + `GRANT ALL` to `service_role`, RLS on, read policy for global rows and own-company rows via `get_user_company_id()`, write policy via `has_role(auth.uid(),'platform_admin')`, plus the shared `update_updated_at_column` trigger. Seed the five flags as global rows.
- `src/hooks/useFeatureFlags.ts`: React Query keyed on company; company-specific row wins over global; rollout evaluated once with a stable per-session seed rather than a bare `Math.random()` on each render.
- `src/lib/agentTypes.ts`: `AGENT_TYPES` and `AGENT_TEMPLATES` as specified, with each type listing the existing agent IDs from `src/lib/agentStyles.ts` it covers so the mapping stays honest. Written guide at `docs/AGENT_ARCHITECTURE.md`.
- Verification: build passes, sidebar renders with no dead links, `/dashboard/platform-guides` redirects for a non-admin, `/status` still loads.
