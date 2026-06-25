## Add "Review & Approve Automation" link to every End-to-End Workflows section

Add a header-level link on the workflow chain section that takes the user to `/dashboard/automation` and shows a live count of pending agent actions awaiting approval.

### Changes

**1. `src/components/ui/workflow-chain-buttons.tsx`**
- Inside the "End-to-End Workflows" header row (next to the lightning icon + title), add a right-aligned link/button:
  - Label: `Review & Approve Automation`
  - Navigates to `/dashboard/automation`
  - Shows a small badge with the pending action count when `> 0`
- Add a small internal hook (or inline `useQuery`) that fetches the pending count from `agent_proposed_actions` for the current `companyId` (from `useAuth`) and subscribes to realtime updates on that table, mirroring the pattern already used in `src/pages/Automation.tsx`.
- Count query: `select id from agent_proposed_actions where company_id = :companyId and status = 'pending'`.
- Use `useNavigate` (already imported) and existing shadcn `Badge` + `Button` (variant `link` or `ghost`, size `sm`) to stay on-theme.
- No styling overrides — use theme tokens (`text-primary`, `bg-primary/10`), no hex colors.

### Why edit the shared component
`WorkflowChainButtons` is the single source of the "End-to-End Workflows" card and is already rendered on every console that needs it (Business Management, Field Ops console, Field Operations dispatch). Adding the link here covers all surfaces in one place — no per-console edits required.

### Out of scope
- No changes to `Automation.tsx`, edge functions, workflow definitions, or the Run with Aura execution path.
- No new database tables, RLS, or migrations — the `agent_proposed_actions` table and policies already exist.
