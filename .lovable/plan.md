# Agent coordination: 4 gaps

Confirmed against the live code and database. Handoff context, handoff validation, and the durable event bus already exist — this plan only closes the four remaining gaps.

## 1. Tools announce what they did

New file `supabase/functions/_shared/agent-tool-events.ts` maps action tools to canonical event names and pulls the ids out of the tool result:

`create_appointment → appointment.created`, `reschedule_appointment → appointment.rescheduled`, `cancel_appointment → appointment.cancelled`, `assign_technician → technician.assigned`, `mark_job_complete → job.completed`, `create_invoice → invoice.created`, `mark_invoice_paid → invoice.paid`, `create_quote → quote.created`, `approve_quote → quote.approved`.

After a tool succeeds in either tool loop of `ai-agent-chat`, publish through the existing event bus (`createEventBus`, one call object: name, companyId, sourceAgent, payload, contextId). Fire-and-forget — the customer's reply never waits, and a failed emit is logged, not thrown. Payloads carry ids and the context id only, no contact details.

## 2. Sessions read their queued events

At session start, claim up to 5 `pending` events addressed to this agent, flip them to `processing`, and render them into the prompt as a short "queued events you should act on" list naming the event and its ids. After a successful reply mark them `processed`; on error release them back to `pending` so the two-minute worker still delivers them. The claim update is conditioned on the rows still being `pending`, so the worker and a live session can't both take the same row.

There is no `claimed_at` column on the events table and none is added — `processing` status plus the existing `processed_at` is enough.

## 3. A failing tool no longer kills the reply

Each tool call is wrapped. On success: an `ai_agent_logs` row with `tool_success` and duration. On throw: a `tool_failed` log row with the error and duration, a `tool.failed` event, and the error handed back to the model as a tool result so it keeps going and answers with what it could do. Remaining tools still run.

## 4. Context renders readably

Replace the raw `Current Context: {…JSON…}` line in the system prompt with a named block — customer, appointment and service details, address, invoice — built from the stored structured context, followed by "use this instead of asking again".

## Technical notes

- All edits are in `supabase/functions/ai-agent-chat/index.ts` plus the one new shared file. No change to the event bus, subscriptions, or orchestrator.
- No schema migration. One optional partial index on `ai_agent_events(company_id, target_agent, created_at) where status = 'pending'` to keep the claim query cheap.
- Additive: existing conversations and the background worker behave exactly as before.

## Verification (live, on the deployed function)

1. Booking creates an appointment → an `appointment.created` row exists with the appointment id and dispatch as a target.
2. A dispatch session started afterwards claims that event, references the appointment without re-asking, and the row ends as `processed`.
3. A forced tool failure → the agent still replies, a `tool_failed` log row and a `tool.failed` event exist, and later tools still ran.
4. Job completed → customer journey picks it up on its next session.

Test records are removed afterwards.

## Not included

Load testing, branch/staging strategy, rewriting the remaining handoff pairs' prompts, metrics dashboard work.
