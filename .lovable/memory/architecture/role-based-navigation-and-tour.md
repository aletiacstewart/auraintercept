---
name: Role-based sidebar navigation + Shepherd product tour
description: Phase 6 standard — NAVIGATION_BY_ROLE config, DashboardSidebar rendering/filtering, Shepherd.js product tour, admin Feature Flags & System Health pages
type: feature
---

## Navigation
- `src/lib/navigationConfig.ts` is the single source of truth: `NAVIGATION_BY_ROLE` for platform_admin, company_admin, employee, technician, customer. Items carry icon, href, optional requiredTier / requiredJobTypes / featureColor / tourId / submenu. `RESTRICTED_SECTIONS` hides Configuration, Integrations, Admin from employees without full access. `findNavItemByHref` powers page titles.
- `src/components/dashboard/DashboardSidebar.tsx` renders the menu and applies all filtering: plan tier (isAtLeastTier, skipped while tier resolves), employee job types, profile spec (navItemAllowedByProfile), industry pack overrides (field-ops hiding, saas_platform → Operations Map, label overrides), `isNavHrefHiddenForIndustry`. Platform admin bypasses filtering.
- `DashboardLayout.tsx` no longer holds nav data; it mounts `<DashboardSidebar />`. `TechnicianDashboardLayout.tsx` derives its side menu from `NAVIGATION_BY_ROLE.technician`.

## Product tour
- `src/components/onboarding/ProductTour.tsx` (`ProductTourProvider` + `useProductTour`) uses Shepherd.js 15, steps from `src/components/tutorial/tutorialSteps.ts` (which now owns the `TutorialStep` type). Steps whose target is absent are skipped. Completion/skip stored in localStorage `aura-product-tour-completed-<role>`. Styling in index.css under `.aura-tour-step` uses app tokens (no default purple). Replay link lives in the AI Help Center panel. Old tutorial system (DashboardTutorial.tsx, TutorialStep.tsx, useTutorial.ts) deleted.

## Admin pages
- `/dashboard/admin/feature-flags` (FeatureFlagsAdmin) edits the `feature_flags` table: enable switch + rollout %, shows global vs company override.
- `/dashboard/admin/system-health` (SystemHealthAdmin) holds autonomy status, public status editor, platform blog. `src/pages/PlatformHealth.tsx` deleted; `/dashboard/platform-health` redirects here.
