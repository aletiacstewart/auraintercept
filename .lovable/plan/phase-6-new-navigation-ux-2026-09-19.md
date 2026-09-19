# Phase 6: New Navigation & UX

Two parts: one place that defines the menu per role, and a guided product tour built on Shepherd.js.

## 6.1 Role-based menu

Today the menu is hard-coded inside the dashboard layout file, mixed together with the filtering rules. It moves into a single config file, slimmed down to your shorter per-role lists, with the existing smart hiding kept on top.

**New file `src/lib/navigationConfig.ts`** holds `NAVIGATION_BY_ROLE` for platform_admin, company_admin, employee, technician and customer, using the items you listed. Each item keeps the extra fields the current menu needs (icon component, plan requirement, job-role requirement) so nothing that a customer's plan or industry excludes shows up. Submenu support is added for the Admin group.

**New file `src/components/dashboard/DashboardSidebar.tsx`** renders the menu: reads the signed-in role, pulls its list, applies the existing rules (plan level, job role, industry hiding, profile-driven console gating, industry-specific wording such as Bookings / Reservations / Service Visits), and renders links with active highlighting and a collapsible Admin submenu.

The dashboard layout keeps the header, plan badge, mobile behaviour and sign-out, and simply mounts the new sidebar. Tour targets (`data-tour-id`) carry over so the tour keeps working. The technician layout keeps its own bottom-bar/side menu but now reads its items from the same config file.

Resulting counts: platform admin ~6 top items plus an Admin submenu, company admin 10, employee 5, technician 5.

## Missing admin screens

The Admin submenu needs three destinations. Industry Packs already exists at `/dashboard/admin/industry-packs`. Two are new, both platform-admin only:

- **Feature Flags** (`/dashboard/admin/feature-flags`) — table of the flags in the database with on/off switches, rollout percentage, optional per-company scope, and a description column.
- **System Health** (`/dashboard/admin/system-health`) — reuses the existing platform health page content (backend services, scheduled jobs, recent errors) under the new route; the old route redirects here.

## 6.2 Product tour with Shepherd.js

Shepherd.js is added as a dependency and replaces the current custom tour overlay.

- **`src/components/onboarding/ProductTour.tsx`** exposes `useProductTour()`, building a tour from the existing role-specific step definitions (welcome, dashboard, scheduling, agents, connections, analytics, help), each anchored to its menu item or page element, with Next / Back / Skip buttons and scroll-to.
- Styling is themed with the app's own tokens so it matches the dark UI (no purple default theme).
- **When it runs:** offered right after the First Steps checklist is finished or dismissed — never automatically on a repeat visit. Completion and skip are stored in the browser plus the user's profile so it doesn't reappear.
- **Replay:** a "Replay product tour" entry in the Help menu and on the Help page starts it again from step one.
- The old tour overlay components and hook are removed once every entry point uses the new one.

## Technical notes

- Files added: `src/lib/navigationConfig.ts`, `src/components/dashboard/DashboardSidebar.tsx`, `src/components/onboarding/ProductTour.tsx`, `src/pages/admin/FeatureFlagsAdmin.tsx`, `src/pages/admin/SystemHealthAdmin.tsx`.
- Files changed: `DashboardLayout.tsx` (mounts sidebar, drops inline `navGroups`), `TechnicianDashboardLayout.tsx` (reads shared config), `App.tsx` (two new routes + redirect), `Dashboard.tsx` and the Help surface (tour trigger).
- Files removed: `src/components/tutorial/DashboardTutorial.tsx`, `TutorialStep.tsx`, `src/hooks/useTutorial.ts`; `tutorialSteps.ts` is kept and reshaped into Shepherd step definitions.
- Existing filter logic (`isAtLeastTier`, `navItemAllowedByProfile`, `isNavHrefHiddenForIndustry`, job-type checks) moves into the sidebar component unchanged.
- Feature flags screen writes to the existing `feature_flags` table; platform-admin write policy already exists, so no migration is needed.
- Verification: typecheck and build, then sign in through the super switcher as a platform admin, a company admin and a technician demo account to confirm each menu and the tour.
