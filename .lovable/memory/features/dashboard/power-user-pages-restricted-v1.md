---
name: Power-user pages removed / restricted
description: Phase 1 cleanup — which admin-only pages were deleted, which were kept, and route gating
type: constraint
---
Phase 1 cleanup (Sep 2026) DELETED these pages, routes, sidebar/dashboard links, tour steps and voice-nav aliases — do not re-add:
`/design-preview`, `/dashboard/cyber-sentry-mockup`, `/dashboard/cyber-sentry-portal-mockup`, `/dashboard/platform-brief` (+ `src/lib/platformBrief.ts`), `/dashboard/architecture` (+ `/dashboard/ai-agent-demo` redirect), `/dashboard/pack-coverage`, `/dashboard/calculators`, `/dashboard/platform-issues`.

KEPT deliberately:
- `/status` public status page and `/dashboard/platform-health` (contains the status editor).
- `/dashboard/super-switcher` + `/super-switcher` — one-click demo sign-in for the demo account registry.
- `/dashboard/platform-guides` — now gated `requiredRole="platform_admin"` at the route; hosts guides, documentation export and video prompts.
- `/audit` stays PUBLIC (Free Audit lead-gen).

The `platform_issues` table remains; only the admin viewer page was removed.
