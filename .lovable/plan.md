## Platform Design System Pass

A broad consistency sweep across the app and public homepage. Ordering below matches the recommended sequence in the request.

### 1. Remove "Cyber-Sentry Edition" branding
- Global search for `Cyber-Sentry`, `Cyber Sentry`, `CYBER-SENTRY`, `cyber-sentry` (case-insensitive) across `src/`, `public/`, memory docs, and templates.
- Strip the ` — CYBER-SENTRY EDITION` suffix from console headers (Service Management, Outreach & Sales Ops, Business Management, Customer Portal, and any others found). Leave the plain console name.
- Rename any variables/CSS class names/comments that reference the phrase where it's user-visible; keep internal file names (e.g. `cyber-sentry-*.md` memory files) but drop the term from any rendered string.
- Update `mem://` core rule that references "Cyber-Sentry UI" to just describe the token/theme rule without the branding label.

### 2. Semantic section-header color system
Introduce a single mapping used by `PageHeader` (`src/components/ui/page-header.tsx`) via a new `pageCategory` → `featureColor` resolver:

- Cyan/Teal (`fieldops`) — Service Management, Dispatch, Appointments, Field Ops surfaces.
- Magenta/Pink (`config`) — Settings, Knowledge Base, Automation, Integrations.
- Green (`customers`) — Customer Portal, Web Presence (published).
- Purple (`platform` / new `ai` token if needed) — AI Operatives Hub, Specialist Operatives, AI consoles.

Audit every `<PageHeader featureColor=…>` call site and reassign to match the mapping. Add a lightweight lint-style unit test in `src/lib/__tests__/` that asserts key pages use the expected category.

### 3. Unified status badge system
- Create `src/components/ui/status-badge.tsx` (or extend existing `value-badge`) exporting a `<StatusBadge tone="success|warning|neutral|danger|info">` with tokens:
  - success = green, warning = amber, neutral = gray, danger = red, info = blue.
- Map current strings: Active/Approved/Auto-executed/Free/Live → success; Required/Pending/Needs action → warning; Optional/Inactive/Not configured → neutral; Failed/Error/Critical → danger; informational-only → info.
- Refactor badge usages in: Settings, Integrations pages, Automation, AI Operatives Hub (incl. `AgentWorkflowMonitor`, `DecisionModeBadge` review/escalate variants stay but align to tokens), all consoles, Knowledge Base ServicesManager.

### 4. Empty-state chart rendering (Website Analytics)
In `WebsiteAnalytics` (Daily Traffic Trend, AI Engagement Trend):
- Detect zero-data (all series values 0 or empty).
- Replace the chart with the existing empty-state pattern ("No visitor data yet") — hide axes/line entirely rather than drawing a flat baseline.

### 5. Pagination / virtualization for long lists
- Blog management list (`src/pages/BlogManagement.tsx`): add a search input + 25/page pager.
- `AgentWorkflowMonitor` events: add search/filter input (by agent or event type) plus a 25/page pager, replacing the flat 100-event scroll.
- Audit other long lists (CRM leads table, Appointments history, Call History, Email Logs) and apply the same pattern where item counts routinely exceed ~30.

### 6. Workflow card layout across AI Consoles
- Extract the 3-card End-to-End Workflows row used in Business Management and Service Management consoles into a shared component (or ensure they already share one) with fixed card height, spacing, and spacing-above-chat.
- Apply it to Outreach & Sales Console and any other console rendering equivalent workflow cards.

### 7. Non-color indicators on status dots
- Operative Dependencies panel: alongside each colored dot, render a small icon (check / dash / warning triangle) and/or a short text label so state is legible without color.
- Sweep for other dot-only status indicators (uptime pills, connection dots) and add matching icon/text.

### 8. Contrast audit on muted text over dark panels
- Sample the muted/gray colors used on near-black panels (timestamps, descriptions, helper text).
- Adjust the `--muted-foreground` (and any hardcoded gray usages found) so body text hits WCAG AA 4.5:1 and large text 3:1 against the panel background token, preserving hierarchy vs primary text.

### 9. Homepage "All-in-One AI Center" 8-box grid — apply console/operative colors
On the public homepage, map each of the 8 feature boxes to the closest existing console/operative category and reuse that section's color token — no new colors.

### 10. Homepage "Connect Everywhere" 4-box channel grid — distinct palette
Assign Voice / SMS / Email / Chat a set of 4 colors that don't collide with any console or operative color already used on the page. Keep the four internally coherent.

### 11. Industries grid — confirmation only
Leave the uniform teal treatment as-is. No code change unless the user says otherwise.

### Execution order
1. Item 1 (find/replace).
2. Items 2 + 3 together (shared header/badge refactor).
3. Items 9 + 10 together (homepage color pass).
4. Items 4, 5, 6, 7, 8 independently.
5. Item 11 = no-op.

### Technical notes
- All colors resolve to existing CSS variables in `index.css` / `tailwind.config.ts`. No hex/rgba literals in components.
- New `StatusBadge` will live next to `value-badge.tsx` and reuse shadcn `Badge` primitives.
- `PageHeader` gets a small `pageCategory` helper so future pages can't drift.
- Pagination uses local state + shadcn `Pagination` primitive; no backend changes.
- No schema, RLS, or edge-function changes.
