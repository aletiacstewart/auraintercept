## Goal

Make "Run with Aura" actually create real, reviewable drafts in `agent_proposed_actions` and surface them in the Automation queue and the relevant channel consoles — instead of only chatting with Aura.

## Scope

End-to-end Workflows triggered from `WorkflowChainButtons` (Business Mgt + Field Ops consoles) become real multi-step runs. Each step produces one row in `agent_proposed_actions` routed through `agent-action-executor`, which honors the per-agent autonomy settings the user already configured at `/dashboard/automation`.

## Changes

### 1. `WorkflowChain` schema gains structured steps
File: `src/components/ui/workflow-chain-buttons.tsx`
- Add optional `actions: WorkflowAction[]` to `WorkflowChain` where each `WorkflowAction` declares `{ agent_id, action_type, channel: 'sms'|'email'|'voice'|'appointment'|'invoice'|'task', risk_tier, confidence, est_value_usd, draft: (ctx) => payload, label }`.
- `onTrigger` signature becomes `(chain: WorkflowChain) => void`.

### 2. New runner hook `useRunWorkflowChain`
File: `src/hooks/useRunWorkflowChain.ts` (new)
- Resolves `companyId`, pulls the latest lead/customer/invoice/appointment row needed per action (`reads`), composes drafts, and POSTs each step to `agent-action-executor` (`op=propose`).
- Returns `{ run, lastRunId, isRunning }`.
- Shows one toast summarizing "N drafts queued for approval • M auto-executed".

### 3. `BusinessManagementConsole.tsx` + `FieldOpsConsole.tsx`
- Replace `onTrigger={(cmd) => { toast; submitQuery(cmd); }}` with `onTrigger={runChain}`.
- Keep `command` string as a fallback prompt the runner sends to Aura only after the action rows are written (so the inline chat still narrates what just happened).

### 4. `industryWorkflows.ts` action templates
- Add `actions` arrays to the existing chains. Starter coverage:
  - `lead-to-invoice` (trades): Draft SMS to latest lead • Draft Quote • Draft Appointment • Draft Invoice
  - `inbound-demo` (saas): Draft Email to lead • Create Calendar Hold • Draft Follow-Up SMS
  - `renewal-churn-save`: Score risk (read-only) • Draft Email offer
  - `appointment-reminders`: For each appt in next 48h → Draft SMS reminder
- Workflows without a structured `actions` array keep current behavior (prompt-only).

### 5. `agent-action-executor` — execute approved actions
- Extend `op=approve` to actually perform side-effects based on `action_type`:
  - `draft_sms` → insert into `sms_logs` (status='queued') and invoke `send-sms` if a number exists
  - `draft_email` → invoke `send-transactional-email` with `templateName='custom-draft'` and the payload body
  - `create_appointment` → insert into `appointments` (status='pending_confirmation')
  - `draft_invoice` → insert into `invoices` (status='draft') + line items
- Auto-executed rows run the same side-effect inline at propose time.
- All failures flip status to `failed` with `result_summary` set; nothing throws past the response.

### 6. Console-level "Pending Aura Drafts" strips
- Phone & SMS console: filter `agent_proposed_actions` where `payload->>'channel'='sms' AND status='pending'`, show Approve/Reject inline.
- Email console: same with `channel='email'`.
- Appointments console: `action_type='create_appointment'`.
- Billing console: `action_type='draft_invoice'`.
- Reuse a new shared component `PendingAuraDraftsPanel` (props: `channel` or `actionTypes`).

### 7. `Automation.tsx` Action Queue
- Already reads `agent_proposed_actions`; only update is per-row "View payload" expander showing the actual drafted SMS body / email subject+body / appointment time, plus a "Open in [Console]" deep link.

## Out of scope (explicit)

- No new tables; reusing `agent_proposed_actions`, `sms_logs`, `appointments`, `invoices`, `email_send_log`.
- No model orchestration / Aura tool-calling refactor — workflow drafts are template-driven and deterministic. Aura's inline chat still narrates afterward.
- No changes to Stripe, demo seeding, or industry packs.

## Verification

1. From Business Mgt console run "Lead → Invoice" → see 4 rows appear at `/dashboard/automation` Action Queue + in Phone/SMS, Appointments, Billing console strips.
2. Approve the SMS row → row in `sms_logs` and status flips to `executed`.
3. Approve the Email row → `email_send_log` entry exists.
4. Run the same workflow under a SaaS demo company → see the SaaS-specific actions (Email + Calendar Hold), not the trades ones.
5. Set Outreach agent to `auto_safe` with confidence ≥ 0.9 → re-run, low-risk drafts auto-execute without queueing.

OK to proceed?