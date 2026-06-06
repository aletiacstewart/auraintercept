# Fix: "Run with Aura" lands on Business Management page (all industries)

## Root cause

1. **Run with Aura** on a workflow card calls `useAuraCommand.submitQuery(cmd)`.
2. `src/hooks/useAuraCommand.ts:36-56` unconditionally runs `navigate("/dashboard/analytics-reports?q=...")` for every query.
3. `src/App.tsx:237` maps `/dashboard/analytics-reports` → `<BusinessOperations />` (the **Business Management Overview** page).
4. `BusinessOperations` only reads `?tab=`, **never `?q=`** — so the command string is silently dropped and the user just sees Business Management.

Because the dispatch is industry-agnostic, this is broken for all 28 industry packs simultaneously.

## What it should do

Stay on the console you launched from, open the Aura chat inline, send the workflow `command` to it, and stream the response in place. The `targetRoute` on each workflow stays reserved for the **Open Page** button (unchanged).

## Plan

### 1. Lift Aura command execution out of "always navigate"
- Introduce a small `useAuraExecutor` (or extend `useAuraCommand`) that exposes `runInline(command)`:
  - Posts the command into the page-local Aura chat surface (the same path `InlineAuraBar` uses to send a user message).
  - Returns immediately so the caller can show a toast / inline state.
  - Falls back to a smart navigate **only** if no inline chat is mounted on the current page — and in that case routes to a destination that actually consumes `?q=` (a dedicated Aura runner surface), not the Business Management overview.

### 2. Wire workflow cards through the new executor
Update the three callers of `WorkflowChainButtons` so **Run with Aura** uses `runInline`:
- `src/pages/ai-consoles/FieldOpsConsole.tsx`
- `src/pages/ai-consoles/BusinessManagementConsole.tsx`
- `src/pages/FieldOperations.tsx`

Keep the existing `toast.info('Running workflow…')` for feedback. The **Open Page** button is untouched.

### 3. Stop `useAuraCommand` from funneling everything to Business Management
- Remove the hard-coded `/dashboard/analytics-reports?q=` redirect in `useAuraCommand.submitQuery`.
- Use the existing `detectLocalIntent` + `isDataQuery` + `voiceNavigation` helpers to:
  - run inline when an inline Aura surface is available,
  - route data questions to the **Analytics & Reports** tab (`/dashboard/analytics-reports?tab=analytics&q=...`),
  - route navigation intents to their real destination,
  - otherwise open the global Aura dialog with the query pre-filled.

### 4. Safety net for stale deep links
- Teach `BusinessOperations` to read `?q=` and, if present, forward it into its `InlineAuraBar` so old links like `/dashboard/analytics-reports?q=...` still produce a real Aura response instead of looking broken.

## Out of scope

- Workflow definitions and per-industry command text (`src/lib/industryFieldOpsWorkflows.ts` etc.) — unchanged.
- Agent prompts, edge functions, RLS, pricing, routing config for `/dashboard/analytics-reports`.
- Visual redesign of the workflow cards.

## Verification (run for at least 3 industry packs)

1. On `/dashboard/ai-consoles/field-ops` and `/dashboard/ai-consoles/business-mgt-ops`, click **Run with Aura** on a workflow card → inline Aura chat opens on the same page and starts streaming. Page does NOT navigate to Business Management.
2. Click **Open Page** on the same card → navigates to the workflow's `targetRoute` (unchanged).
3. Switch industry pack (e.g. HVAC → Med Spa → Cleaning) and repeat 1–2. The card list changes per industry; the button behavior is identical and correct.
4. Type a navigation prompt into `InlineAuraBar` → routes to the correct destination, not Business Management.
5. Visit a stale `/dashboard/analytics-reports?q=show%20revenue` link → Business Management loads with the query handed off to its Aura bar.
