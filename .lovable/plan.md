# Make End-to-End Workflows self-explanatory

Two goals: (1) the workflow cards explain themselves in plain English, (2) a short guided intro shows first-time users what happens before they ever click "Run with Aura".

## 1. Clearer wording in the app

- Rename the section heading from "End-to-End Workflows" to **"One-Click Jobs — Aura drafts it, you approve it"** (shorter on mobile: "One-Click Jobs"), with a one-line subheading: "Each card runs a whole job for you. Aura prepares every step as a draft — nothing is sent to a customer until you approve it in the Automation Queue."
- On each card, under the steps row, add a plain-English outcome line: "You get: a text draft, an appointment, and a quote draft — ready to approve." (derived from the chain's actions/steps, so it stays accurate per industry pack).
- Rename the primary button tooltip/helper text: keep "Run with Aura" but add a small caption under the buttons on first view: "Drafts only — you approve before anything sends."
- Update the `RunWithAuraConfirmDialog` copy so the first sentence says what will happen in plain English: "Aura will prepare N drafts (listed below). Nothing is sent until you approve them in the Automation Queue."
- The "Review & Approve Automation" header button gets clearer label: **"Approval Queue"** with the existing pending-count badge.

Files: `src/components/ui/workflow-chain-buttons.tsx`, `src/components/ai/RunWithAuraConfirmDialog.tsx`, and the workflow definitions in `src/lib/industryWorkflows.ts` / `industryFieldOpsWorkflows.ts` / `industryMarketingWorkflows.ts` only where an `outcome` line needs adding (add an optional `outcome?: string` field; fall back to auto-derived text when absent).

## 2. Guided intro (first-time walkthrough)

- Add a **"How one-click jobs work"** help button next to the section heading (uses the existing `HowToUseModal` pattern already on these pages) with 4 short steps:
  1. Pick a card — it's a whole job, not just one task.
  2. Confirm — you see exactly what Aura will draft first.
  3. Aura drafts each step with your real customer/business details.
  4. You approve in the Approval Queue — nothing reaches a customer until then.
- First visit auto-prompt: the first time a signed-in user sees a page with workflow cards, show the same modal once (dismiss stores `aura-workflows-intro-seen` in localStorage; never blocks the page).
- Content for the modal goes into `src/lib/howToUseContent.ts` as a new `workflows` entry so it stays consistent with the other help content.

## Technical notes

- No behavior changes: run flow, confirm dialog logic, and the approval queue stay exactly as they are — this is wording + one help modal.
- Follows existing patterns: `HowToUseModal`, design tokens only, no hardcoded colors.
- Keep all edited components under the 300-line composition guideline.
- Verify with the build check afterwards.
