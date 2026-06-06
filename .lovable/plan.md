# Make "Run with Aura" transparent (preview + confirm)

## Goal
Before any workflow runs, show the user exactly what Aura is about to do, which data it will read, which external actions it will perform (SMS / email / assignments / DB writes), and require a Confirm click. After they confirm, stream a live step-by-step log in the inline Aura chat so they can see what actually happened.

## What changes for the user

1. Click **Run with Aura** on any workflow card.
2. A modal opens titled "Review before Aura runs" with four sections:
   - **What it will do** — the chain steps in plain English (already on the card, expanded).
   - **Data it will read** — e.g. "Pending jobs (last 24h), active technicians, customer contact info."
   - **Actions it will take** — color-coded chips: read-only (neutral), DB write (amber), customer-facing message (red). Each line names the channel and rough volume ("Up to ~12 SMS to customers", "Assigns jobs to technicians in `job_assignments`").
   - **Cost / 3rd-party notice** — surfaces the standard third-party fee disclaimer when SMS/email/voice is involved (per the project's third-party policy).
3. Footer: **Cancel** | **Run now**. "Run now" is the only path that dispatches the command.
4. After confirm: the inline Aura chat opens and streams the command + Aura's step-by-step response (no behavior change here — already wired via `auraRunBus`).

## What changes in code

### 1. Workflow metadata — add a `preview` block
`WorkflowChain` (in `src/components/ui/workflow-chain-buttons.tsx`) gets an optional `preview`:
```ts
preview?: {
  reads: string[];          // human-readable list
  writes: string[];         // DB writes
  sideEffects: Array<{
    channel: 'sms' | 'email' | 'voice' | 'assignment' | 'calendar' | 'none';
    description: string;    // "Sends up to ~N SMS ETAs to customers"
  }>;
  estimatedVolume?: string; // optional "≈ 8–15 jobs affected"
}
```
Populate `preview` for every existing workflow in:
- `src/pages/FieldOperations.tsx` (DISPATCH_WORKFLOWS)
- `src/pages/ai-consoles/FieldOpsConsole.tsx`
- `src/pages/ai-consoles/BusinessManagementConsole.tsx`
- `src/lib/industryFieldOpsWorkflows.ts` (per-industry chains)

When `preview` is missing, the modal shows a generic "Aura will interpret this command and may read your business data" warning so legacy entries still get a confirm step.

### 2. New component `RunWithAuraConfirmDialog`
`src/components/ai/RunWithAuraConfirmDialog.tsx` — shadcn `Dialog`, theme tokens only (no hex/rgba per Cyber-Sentry rule). Receives the `WorkflowChain` + `onConfirm`. Renders the four sections above and the third-party fee disclaimer when any `sideEffects.channel` is sms/email/voice.

### 3. Wire it into `WorkflowChainButtons`
`onTrigger` no longer fires immediately. Clicking **Run with Aura** sets local state `{ pending: chain }` which opens the dialog. **Cancel** clears it; **Run now** calls the existing `onTrigger(chain.command)` (which already dispatches via `auraRunBus`).

The **Open Page** button is unchanged.

### 4. Aura inline response — show a "Running:" header
Tiny addition to `InlineAuraBar`: when a command arrives via `subscribeAuraRun`, prepend a small system bubble: "Running workflow: {label} — you can stop at any time." This makes it obvious the chat output corresponds to the button they just confirmed. (No new bus event needed — we extend `dispatchAuraRun` to accept `{ command, label? }`; existing callers keep working.)

### 5. Nothing else changes
- No edge functions, no RLS, no pricing, no routing.
- No workflow `command` strings are rewritten.
- Per-industry behavior stays identical; the modal just appears in front of dispatch for all 28 packs.

## Verification

1. On `/dashboard/ai-consoles/field-ops`, `/dashboard/ai-consoles/business-mgt-ops`, and `/dashboard/dispatch-field-ops`: click **Run with Aura** → modal appears with reads / writes / side effects / disclaimer.
2. **Cancel** → nothing is dispatched, no chat message, no DB writes.
3. **Run now** → inline Aura chat opens, "Running workflow: …" header, then the streamed response.
4. Switch industry pack (HVAC → Med Spa → Restaurant): each pack's workflow chains show their own preview content; modal still opens for every card.
5. A workflow with no `preview` defined still opens the modal with the generic warning (graceful fallback).
6. **Open Page** button on every card still navigates to `targetRoute` and skips the modal.

## Out of scope

- Dry-run / simulation mode (we picked transparent + confirm, not transparent + dry-run).
- Removing the feature.
- Changing the workflow lists themselves or the operative routing.
- Per-workflow per-customer review screens (still one confirm per workflow, not per record).
