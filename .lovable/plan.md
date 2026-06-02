# Console Tabs Render Empty + Duplicate "Service Management" in Sidebar

## What's broken

### 1. Console tab icons show nothing (Analytics, Service Management, Marketing, Social, etc.)

Each console (`AnalyticsAgentConsole`, `FieldOpsAgentConsole`, `MarketingSalesAgentConsole`, `SocialMediaAgentConsole`, …) renders a tab strip (Home, Report, Revenue, Insights, KPIs, Social, Reminders, Export, etc.). Clicking a tab is supposed to render a form/panel in the center pane. Today it silently renders nothing because:

- Every form is gated `showXForm && effectiveCompanyId && <FormX />`. For platform_admin (or any session that hasn't picked a company workspace) `effectiveCompanyId` is null → the form never mounts, the welcome screen is also hidden (`showWelcome = !isShowingForm && messages.length === 0` is false because `showXForm` is true), so the center is blank.
- In `FieldOpsAgentConsole` the same applies to every `selectorMode` branch (eta, accept, arrive_start, complete, quote, invoice, dispatch). The selector lists need company jobs; when none exist or `effectiveCompanyId` is missing the panel is empty with no fallback.
- The two consoles already fixed last loop (`MarketingSalesAgentConsole`, `SocialMediaAgentConsole`) added a "Sign in to a company workspace…" placeholder. The other consoles still need the same fallback.

### 2. Two "Service Management" links in sidebar, second one loads blank

In `DashboardLayout.tsx` the **Field Ops** group has two items:

| href | base label | overridden by |
|---|---|---|
| `/dashboard/ai-consoles/field-ops` | "Technician View" | `serviceConfig.workerSubItemLabel` |
| `/dashboard/dispatch-field-ops` | "Dispatch View" | `serviceConfig.dispatchSubItemLabel` |

For the active industry pack, **both** override values currently resolve to "Service Management" so the sidebar shows the same label twice. The second link routes to `/dashboard/dispatch-field-ops` → `OperationsRouter`, which stays on the `Skeleton` loader because `useWorkspace()` never resolves for this account (no `companyId` / no workspace row), producing the blank "loading" pane in the third screenshot.

## Fix

### A. Console fallbacks (empty/no-company state)

For every tab-driven console, add an explicit empty state inside the center pane that renders when the tab opens but the data needed to fill it isn't available. Pattern (already shipping in Marketing/Social):

```tsx
{activeTab !== 'chat' && !effectiveCompanyId && (
  <EmptyConsolePanel
    title="Pick a company workspace"
    body="This panel needs a company context. Open the workspace switcher to load data."
  />
)}
```

Apply to:

1. `src/components/analytics/AnalyticsAgentConsole.tsx`
   - Render the placeholder when any `show*Form` is true but `effectiveCompanyId` is missing.
   - Also render an empty-state when `showWelcome` is true and the user has no company (currently shows the NL hero which loads nothing).
2. `src/components/employee/FieldOpsAgentConsole.tsx`
   - For every `selectorMode` branch: when `effectiveCompanyId` is missing OR the job/quote/invoice list resolves to zero, show a one-line empty state inside the same panel with a "Create job" / "Open Schedule" CTA, instead of leaving the pane blank.
   - Dispatch (`tel:` action) already toasts; keep.
3. Audit the remaining consoles for the same pattern and patch identically:
   - `src/pages/ai-consoles/SpecialistOperativesConsole.tsx`
   - `src/pages/ai-consoles/BusinessManagementConsole.tsx`
   - `src/pages/ai-consoles/CustomerPortalConsole.tsx`
   - `src/components/businessops/BusinessOpsConsole.tsx` (if it uses the same tab pattern)

Add a small reusable `<EmptyConsolePanel />` in `src/components/ai/chat/` to avoid copy-paste.

### B. Sidebar duplicate label + blank dispatch page

In `src/components/dashboard/DashboardLayout.tsx`:

- Stop forcing both Field Ops items through `serviceConfig.workerSubItemLabel` / `dispatchSubItemLabel` when they would resolve to the same string. Tweak the rendering at lines 488–492:

  ```ts
  if (item.href === '/dashboard/ai-consoles/field-ops') {
    displayLabel = serviceConfig.workerSubItemLabel || 'Technician View';
  } else if (item.href === '/dashboard/dispatch-field-ops') {
    const dispatchLabel = serviceConfig.dispatchSubItemLabel || 'Dispatch View';
    displayLabel = dispatchLabel === serviceConfig.workerSubItemLabel
      ? `${dispatchLabel} — Dispatch`
      : dispatchLabel;
  }
  ```

  This guarantees the two entries are visually distinct (e.g. "Service Management" + "Service Management — Dispatch", or the original "Technician View" / "Dispatch View" when no overrides are configured).

- Replace the icons so the two items aren't both rendered with the same glyph at small sizes (Technician → `Truck` already, Dispatch → keep `Map` but ensure the underlying `Field Ops` group header doesn't repeat).

In `src/pages/operations/OperationsRouter.tsx`:

- When `useWorkspace()` returns no workspace (platform_admin / unconfigured tenant), stop rendering the infinite `Skeleton`. Show a `PageHeader` + an empty card with "No dispatch workspace configured yet. Set up Field Ops in Settings → Operating Model." plus a button to `/dashboard/quick-setup`.
- Keep current behavior when `loading === true` (real loading), but bail out with the message when `!loading && !workspace`.

### C. Verification

1. `/dashboard/ai-consoles/analytics` → click each tab (Report, Revenue, Insights, KPIs, Social, Reminders, Export). Either the form mounts or the "Pick a workspace" placeholder appears — never blank.
2. `/dashboard/ai-consoles/field-ops` → click ETA, Accept, Complete, Quote, Invoice. Each opens a selector or empty-state with CTA.
3. Sidebar Field Ops group renders two visually distinct items; clicking the second navigates to `/dashboard/dispatch-field-ops` and shows either dispatch data or the "no workspace" empty state instead of the blank skeleton.
4. `MarketingSalesAgentConsole` and `SocialMediaAgentConsole` keep their existing behavior (already fixed last loop).

## Out of scope

- Stripe, SMS integration, or pricing copy.
- Refactoring `CyberConsoleLayout` (children rendering already correct).
- Rewriting `useWorkspace` — only adding a sane empty state when it returns nothing.
