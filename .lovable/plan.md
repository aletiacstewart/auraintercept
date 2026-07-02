## Merge Platform Resources sidebar pages

Consolidate 9 sidebar entries → 3, using tabs inside each host page. Keep old routes alive as redirects so links don't break.

### Merges

1. **Platform Guides** (host) absorbs **Export Docs** + **Video Prompts**
   - Add `Tabs` to `src/pages/PlatformGuides.tsx`: `Guides` (current content), `Export Docs` (render `<ExportDocumentation />`), `Video Prompts` (render `<VideoPromptsPage />`).
   - Sync active tab with `?tab=guides|export|video` query param.
   - Remove `Export Docs` and `Video Prompts` items from sidebar in `src/components/dashboard/DashboardLayout.tsx`.
   - In `src/App.tsx`, redirect `/dashboard/export-docs` → `/dashboard/platform-guides?tab=export` and `/dashboard/video-prompts` → `?tab=video`.

2. **Architecture** (host) absorbs **AI Agent Demo**
   - Add tabs to `src/pages/Architecture.tsx`: `Architecture`, `AI Agent Demo` (renders `<AIAgentFlowDemo />`).
   - `?tab=architecture|demo`.
   - Remove `AI Agent Demo` sidebar entry; redirect `/dashboard/ai-agent-demo` → `/dashboard/architecture?tab=demo`.

3. **Subscription Analytics** (host) absorbs **Onboarding Invites**
   - Add tabs to `src/pages/SubscriptionAnalytics.tsx`: `Analytics`, `Onboarding Invites` (renders `<OnboardingInvites />`).
   - `?tab=analytics|invites`.
   - Remove `Onboarding Invites` sidebar entry; redirect `/dashboard/onboarding-invites` → `/dashboard/subscription-analytics?tab=invites`.

4. **Platform Issues** (host) absorbs **Help**
   - Add tabs to `src/pages/PlatformIssues.tsx`: `Issues`, `Help` (renders `<Help />`).
   - `?tab=issues|help`.
   - Remove `Help` sidebar entry; redirect `/dashboard/help` → `/dashboard/platform-issues?tab=help`.
   - Note: `Help` is currently visible to `company_admin` and `employee`. Since Platform Issues is platform_admin-only, keep the standalone `/dashboard/help` route rendering `<Help />` for non-admin roles (only sidebar link is removed for platform_admin). For platform_admin, redirect to the merged tab.

### Resulting Platform Resources sidebar
- Subscription Analytics
- Platform Issues
- Platform Guides
- Architecture

### Technical details
- Use existing `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent` from `@/components/ui/tabs`.
- Tab state driven by `useSearchParams` so redirects with `?tab=` land on the right pane.
- Do not modify the child page components themselves — just import and render them inside the host tab.
- Keep all existing route protection (`platform_admin`) on the surviving routes.
- No changes to page business logic, data, or styling beyond adding the tab shell.

### Out of scope
- Renaming pages, merging their internal content, or changing the child components.
- Any non-sidebar navigation surfaces (command palette, deep links elsewhere) beyond the redirects listed.
