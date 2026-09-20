# Phase 3: Event Bus for Agent-to-Agent Communication

## What exists today

Agents already pass messages through the orchestrator: an `emit_event` action writes rows to the `ai_agent_events` table, a routing table decides which agents receive which event, and a background job every 2 minutes delivers pending events to the receiving agent. So the durable, non-blocking backbone is real and running.

What is missing is the part this phase asks for: a proper event bus object with `emit()` and `subscribe()`, typed event names and payloads, subscriptions declared per agent instead of buried in one routing table, retry on failure, and — most importantly — nothing currently emits when an appointment is created, a technician is assigned, or a job is completed. Only online bookings emit anything.

## What gets built

### 1. Shared EventBus (`supabase/functions/_shared/event-bus.ts`)

- `AgentEvent` types with canonical dotted names: `appointment.created`, `appointment.scheduled`, `appointment.cancelled`, `technician.assigned`, `job.started`, `job.completed`, `quote.sent`, `invoice.paid`, `lead.qualified`, `review.received`.
- Typed payload per event family (appointment, technician, job) reusing the existing `AgentContext` shape so a delivered event carries the same structured customer/appointment data the handoff work already introduced.
- `EventBus` class:
  - `subscribe(eventName, agentType)` — registers an agent as a subscriber.
  - `subscribers(eventName)` — discovery, used by the orchestrator and the UI.
  - `emit(event)` — writes one durable row per subscriber plus a broadcast row, then returns immediately. Never awaits agent work, never throws into the caller's request path (failures are logged as a failed row).
- Old underscore names (`appointment_booked`, `tech_assigned`, `job_complete`) stay accepted as aliases so nothing already in flight breaks.

### 2. Subscription declarations (`supabase/functions/_shared/event-subscriptions.ts`)

One declarative list replacing the hardcoded routing map, e.g.

```text
dispatch          -> appointment.created, appointment.scheduled, appointment.cancelled, inventory.low
field_navigation  -> technician.assigned, job.started, route.optimized
customer_journey  -> appointment.scheduled, job.completed, review.received
business_finance  -> job.completed, quote.approved, payment.received
analytics_intelligence -> job.completed, invoice.paid, review.received
```

Each subscription records why the agent cares, so the Agents screen can show "Dispatch reacts to: a new appointment, a cancelled appointment".

### 3. Orchestrator uses the bus

`emit_event` and the pending-event worker call the bus instead of the inline routing map. Delivery gains retry: a failed delivery is retried on the next run up to 3 attempts, with the attempt count and last error stored, then parked as `failed` for the Activity screen.

### 4. Real emit points

- Appointment created (any path: portal booking, staff-created, agent-created) -> `appointment.created`, and `appointment.scheduled` once a time is confirmed.
- Technician assigned to a job -> `technician.assigned`.
- Job marked complete -> `job.completed`.

These fire from the existing backend functions that already perform those writes, so no duplicate logic.

### 5. Proof-of-concept verification

Live tests after deploy: create an appointment and confirm Dispatch receives `appointment.created` with the customer and appointment details; assign a technician and confirm Field Navigation receives `technician.assigned`. Results reported with the actual event rows.

## Technical notes

- Database migration adds `attempt_count` (int, default 0) and `next_attempt_at` (timestamptz) to `ai_agent_events`, plus an index on `(status, next_attempt_at)` so the 2-minute worker scans cheaply. Existing columns and rows are untouched; reversible.
- Emission stays fire-and-forget: the bus inserts rows and returns; delivery happens in the scheduled worker, so no user-facing action waits on agent work.
- Subscribers are still filtered by whether the agent is enabled for that company and by plan tier, using the registry built in Phase 2.
- Specialists remain request/response only — they do not subscribe to lifecycle events.

## Out of scope

- New agents, prompt changes, or new tools.
- Realtime push of events to the browser (the Activity screen keeps polling).
- Reworking the 2-minute schedule into a queue service.
