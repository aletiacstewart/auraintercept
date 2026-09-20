# Structured handoff context between agents

Today, when one agent hands a customer to another, the second agent only receives a sentence of text ("New appointment #12345") plus a loose `customerInfo` blob. Anything the first agent learned — which appointment, which customer record, which job — has to be re-derived or re-asked. This change makes the handoff carry a real, validated data package.

## What changes for users

When the booking agent hands off to dispatch, dispatch already knows the appointment, the customer and their contact details — no repeated questions, no lost details. Everything else keeps working exactly as it does now.

## Scope

Proof of concept on the **booking → dispatch** handoff, built on shared pieces the other handoffs can adopt afterwards with no further redesign. Existing text-only handoffs keep working unchanged (the new context is additive and optional).

## The shared context object

A single `AgentContext` shape used by the backend and the app:

- `contextId` — the existing shared-context row id, when there is one
- `companyId`
- `fromAgent`, `toAgent`, `reason`
- `appointmentId`, `customerId`, `jobId`, `workflowId` (all optional)
- `customer` — `{ name, phone, email, address }`
- `metadata` — free-form key/value bag for agent-specific data
- `createdAt`

## Technical plan

1. **New file `supabase/functions/_shared/agent-context.ts`**
   - `AgentContext` TypeScript interface (above).
   - `buildAgentContext(input)` — normalizes phone/email, strips empty values, stamps `createdAt`.
   - `validateAgentContext(ctx, requirements)` — returns `{ ok, errors[] }`; per-target requirements table, e.g. `dispatch` requires `appointmentId` plus a customer name and phone.
   - `describeAgentContext(ctx)` — renders the object into the prompt block the receiving agent reads, replacing the ad-hoc string building at `ai-agent-chat/index.ts:3886`.
   - `serializeAgentContext` / `parseAgentContext` for transport and for storage in `ai_agent_context.context_data.agent_context`.

2. **`supabase/functions/ai-agent-chat/index.ts`**
   - Accept an optional `agentContext` field on the request body alongside the existing `isHandoff` / `handoffFrom` / `customerInfo` (kept for backwards compatibility; `customerInfo` is folded into `agentContext.customer` when the new field is absent).
   - When `isHandoff`, build the prompt handoff block with `describeAgentContext` instead of the hand-rolled field list.
   - On the emitting side (handoff tool handling, ~line 4175): assemble an `AgentContext` from the tool arguments, the conversation's collected customer info, and any ids produced by tools in this turn (e.g. the `create_appointment` result). Run `validateAgentContext`; if it fails, do not emit the handoff — instead return the tool result telling the agent which field is still missing so it asks for it.
   - Return `agent_context` in the response JSON next to `handoff_to` / `handoff_reason`.
   - Persist it: merge into `ai_agent_context.context_data.agent_context` and include it in the `handoff_history` entry and the `ai_agent_events` payload. No schema migration needed — the existing `context_data` and `handoff_history` JSON columns hold it.

3. **`supabase/functions/ai-orchestrator/index.ts`**
   - `handleHandoff` accepts `payload.agent_context`, validates it with the same shared helper, and stores it on the context row so the two paths agree.

4. **Frontend `src/hooks/useMultiAgentChat.ts`**
   - Read `agent_context` off the response and pass it verbatim into the follow-up call to the target agent (today the follow-up sends only `handoffFrom` / `handoffReason`).
   - Mirror the interface in `src/types/agentContext.ts` so app code is typed against the same shape.

5. **Booking → dispatch proof of concept**
   - Dispatch's requirement set: `appointmentId`, `customer.name`, `customer.phone`.
   - Booking's `handoff_to_agent` tool gains optional `appointment_id` / `customer_id` arguments so the model can name what it just created; the builder also back-fills them from this turn's tool results.
   - Verify with two real requests through the deployed function: a booking that creates an appointment then hands to dispatch (context arrives populated), and a handoff attempted with no appointment (blocked with a clear "still need…" result).

## Out of scope for this pass

Rewriting the other ~20 handoff pairs, changing agent prompts beyond the booking/dispatch pair, and any database migration.
