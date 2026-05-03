# Hybrid Workflow Cards

Make the "End-to-End Workflows" cards (Bid Walk, Change Order, Punch List, etc.) do **two things** instead of just firing the AI prompt: a primary "Run with Aura" action (current behavior) plus a secondary "Open Page" link to the relevant working surface.

## Changes

### 1. Extend the `WorkflowChain` type
File: `src/components/ui/workflow-chain-buttons.tsx`

Add an optional `targetRoute` field:
```ts
export interface WorkflowChain {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  steps: string[];
  command: string;          // AI prompt
  targetRoute?: string;     // NEW — page to open for manual work
}
```

### 2. Update card UI
Same file. Replace the single click handler with two explicit buttons inside the card:
- **Primary** "Run with Aura" (Zap icon) — calls `onTrigger(command)` (existing behavior)
- **Secondary** "Open Page" (ArrowRight icon) — `navigate(targetRoute)`, only rendered when `targetRoute` is set

Whole-card click is removed to prevent accidental AI runs. Buttons use existing `Button` variants (`default` and `outline` size `sm`) — no new tokens.

### 3. Add `targetRoute` to all workflow chains
File: `src/lib/industryFieldOpsWorkflows.ts`

Map each workflow id to the most relevant existing route:

| Workflow id pattern | Target route |
|---|---|
| `bid-walk`, `intake-quote`, `site-survey` | `/dashboard/quotes` |
| `change-order`, `parts-repair`, `intake-diagnose` | `/dashboard/jobs` |
| `punch-list`, `dispatch-complete`, `emergency-*`, `route-service`, `weather-reshuffle`, `install-day`, `route-day`, `end-of-day` | `/dashboard/dispatch-field-ops` |
| `lead-to-booking`, `lead-to-showing`, `no-show-recovery`, `rebook-loop` | `/dashboard/lead-pipeline` |
| `daily-prep`, `daily-brief`, `reservations-prep` | `/dashboard/appointments` |
| `status-update`, `monitoring-check`, `inbox-zero` | `/dashboard/messages` |
| `review-pulse` | `/dashboard/reputation` |
| `listing-launch` | `/dashboard/social-media` |
| `maintenance-renewal`, `recurring-clean` | `/dashboard/customers` |
| `travel-coord` | `/dashboard/calendar` |

Routes that don't exist for a given tenant/industry will simply not render the secondary button (we'll guard with a small allow-list check against the app router).

### 4. Update `WorkflowChainButtons` consumers
Files already using it work as-is (the new prop is optional):
- `src/pages/FieldOperations.tsx`
- `src/pages/ai-consoles/FieldOpsConsole.tsx`

No changes needed in those files.

### 5. Memory
Add a short note: `mem://features/field-ops/workflow-cards-hybrid-action` documenting that workflow cards expose **two actions** (Run with Aura + Open Page) and that new chains added to `industryFieldOpsWorkflows.ts` should set `targetRoute` when an obvious destination exists.

## Out of scope
- No new pages.
- No `?workflow=` deep-link pre-selection on target pages (can be added later if you want the secondary button to also pre-open a panel).
- No changes to `useAuraCommand` routing.

## Result
Each card renders like:
```text
Punch List Closeout                       [icon]
Close out the punch list and invoice
[Punch] -> [Photos] -> [Invoice]
[ Run with Aura ]   [ Open Page -> ]
```
