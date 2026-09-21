# Agent coordination remediation — what is actually missing

I checked the live agent code against the five fixes in the audit. Three are already built (from earlier phases), two are genuinely missing, and one is half-built. The plan below only does the real work.

## Already in place (verified in code)

- **Structured handoff context (Fix 1, mostly)** — handoffs already build a validated `AgentContext` (appointment id, customer id, job id, name/phone/email/address, metadata) and store it on the shared context row (`context_data.agent_context`) plus a snapshot in `handoff_history`. The receiving agent reads it back and gets a formatted "records already created / customer info already collected" prompt block.
- **Handoff validation (Fix 4)** — a handoff is blocked when required data is missing; the agent is told in plain language what it still needs (dispatch requires an appointment plus name and phone).
- **Event bus and subscriptions (part of Fix 2/3)** — a durable event bus with retry, per-agent subscriptions, and a background worker that delivers queued events already exist and run.

## The real gaps

1. **Tools don't announce what they did.** Appointment creation, technician assignment, invoicing and job completion inside the agent chat never emit an event, so subscribed agents never wake up. Events only fire from the separate booking/job functions, not from agent-driven actions.
2. **Agents never read their queued events.** Delivery only happens through the background worker; a live agent session ignores anything waiting for it.
3. **A failing tool kills the whole reply.** A thrown tool error propagates out and the request returns an error to the caller — no per-tool log row, no failure event, no graceful "that step failed, here's what I can still do".
4. **Loaded context is dumped as raw JSON** into the prompt instead of the readable block already used for handoffs.

## What gets built

### 1. Emit events when agent tools succeed
Map the action tools to canonical event names (`appointment.created`, `appointment.rescheduled`, `appointment.cancelled`, `technician.assigned`, `job.completed`, `invoice.created`, `invoice.paid`, `quote.created`, `quote.approved`). After a tool succeeds, publish through the existing event bus (not a new HTTP call to the orchestrator) with the ids the tool returned plus the context id. Fire-and-forget: the customer's reply never waits on it.

### 2. Consume queued events at session start
When a session opens, claim up to 5 pending events addressed to this agent, mark them `processing`, and render them into the prompt as "things that happened you should act on". After the reply is produced, mark them `processed`; on failure, release them back to `pending` so the background worker still picks them up. Claim is guarded so the worker and a live session can't double-handle the same row.

### 3. Tool failure handling
Wrap each tool call: on throw, write an `ai_agent_logs` row (`tool_failed`, error, duration), emit a `tool.failed` event, hand the error back to the model as a tool result, and continue with the remaining tools instead of aborting the response. Successful calls get a `tool_success` log row with duration.

### 4. Readable context in the prompt
Replace the raw `JSON.stringify(contextData)` line with the existing context renderer, so a returning agent sees named customer, appointment, service and invoice details rather than a JSON blob.

## Technical notes

- Changes are confined to `supabase/functions/ai-agent-chat/index.ts` plus a small `_shared/agent-tool-events.ts` (tool → event mapping and payload extraction). No new validator file — `_shared/agent-context.ts` already covers validation; dispatch's requirement list gains the service address.
- Emission uses `createEventBus` from `_shared/event-bus.ts`, so subscriber filtering, retry and attempt counting are unchanged.
- Event payloads carry ids and ids only, no customer contact details.
- No schema migration: `ai_agent_events`, `ai_agent_logs` and `ai_agent_context` already have every column needed. One partial index on pending events by target agent is added for the claim query if it isn't already present.
- Existing conversations keep working; everything added is additive.

## Verification

Live runs against the deployed function:
1. Booking creates an appointment → `appointment.created` row exists with the appointment id → a dispatch session started afterwards sees it in its queue and references the appointment without re-asking.
2. Job marked complete → customer journey's next session picks up the event and drafts the follow-up.
3. Forced tool failure → the agent still replies, a `tool_failed` log row exists, and a failure event is recorded.
Test records are removed afterwards.

## Not included

Load testing, staging/production branch promotion, and rewriting the remaining handoff pairs' prompts.
