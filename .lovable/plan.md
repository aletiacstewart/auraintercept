# Phase 4: Workflow Orchestrator

Today each agent hand-off is a single hop: one agent finishes, passes structured context to the next, and that's it. There is no object that says "this whole job has five steps, here is where we are, and here is what to do when step 3 fails." Phase 4 adds that.

## What you get

A named, multi-step job that Aura runs from start to finish, with a live record of every step:

**New Service Request**
1. Triage — understand what the customer needs
2. Booking — put it on the calendar
3. Dispatch — assign the right technician
4. Field Navigation — plan the route and ETA
5. Customer Notification — text the customer their confirmation

Each step runs only when the one before it succeeded, and it receives the full structured context (customer, appointment, technician, workflow ID) built in Phase 1. A failed step retries up to 3 times with a growing delay. After the third failure the whole run is paused and escalated — a staff notification is raised naming the workflow, the step and the reason, and the run shows as "needs attention" so a person can retry or cancel it.

Customer-facing steps keep the existing rule: the text message is prepared as a draft and lands in the Approval Queue. Nothing goes to a customer without approval.

## How it works

**New table `workflow_runs`** — one row per run: workflow key, company, status (`running` / `waiting` / `escalated` / `completed` / `cancelled`), current step index, the shared agent context, and a per-step log (status, attempts, last error, timestamps). Platform admins and the owning company can read it; only the service role writes.

**`supabase/functions/_shared/workflow-definitions.ts`** — declarative definitions. A step is `{ key, agent, instruction, required, onFailure }`. Adding a workflow means adding an object here, no orchestrator changes. Ships with `new_service_request` plus the existing lead → quote chain expressed in the same shape.

**`supabase/functions/_shared/workflow-engine.ts`** — the orchestrator interface:
- `startWorkflow(key, companyId, context)` — creates the run, returns immediately
- `advanceWorkflow(runId)` — executes the current step, records the outcome, moves on
- `retryStep(runId)` / `cancelWorkflow(runId)` — manual recovery
- `getRun(runId)` — current state for the UI

Steps execute by calling `ai-agent-chat` with the step's agent and the run's accumulated context; the agent's result is merged back into the context so the next step sees the appointment ID, technician, route, etc. Retry limits and backoff reuse the Phase 3 constants (3 attempts, 2/10/30 minutes).

**Event-driven, non-blocking** — `startWorkflow` returns straight away. Advancement is driven by the existing every-2-minute background worker in `ai-orchestrator`, which picks up runs that are due. A step that hands off mid-run (an agent deciding it needs another agent) is recorded in the step log without derailing the sequence.

**Orchestrator actions** — `start_workflow`, `advance_workflow`, `retry_step`, `cancel_workflow`, `list_workflow_runs` added to `ai-orchestrator`, guarded by the same cron/service auth as the rest.

**Triggered automatically** — the `appointment.created` event from Phase 3 can start a `new_service_request` run instead of firing three independent agent notifications. That switch is behind a feature flag so the current behaviour stays until you turn it on.

## Where you see it

A "Workflow runs" panel on the Agents hub (Activity tab): each run shows its name, the five steps with a tick / spinner / warning, who it's for, and for an escalated run the failing step, the error in plain English, and Retry / Cancel buttons.

## Not in this phase

Visual workflow builder, branching or parallel steps, workflows crossing companies, rewriting the one-click job cards (they keep using the draft/approve path).
