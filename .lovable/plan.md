
## Problem

In the customer chat, when the AI tries to book it sometimes loops on `create_appointment` and gives up ("intake data not being accepted"). The customer is left with no visual way to pick a date/time. Today the visual `BookingForm` lives only in the separate "Book" tab — never surfaced inside the conversation.

## Goals

1. Make AI booking actually succeed when intake fields are present.
2. Let the AI post an inline date+time slot picker right inside the chat.
3. If the inline picker can't satisfy the request (industry requires intake, or customer prefers a longer form), the AI offers a one-tap button that opens the existing full Book form.

## Changes

### 1. Edge function: `supabase/functions/ai-agent-chat/index.ts`

- **Fix the intake_data rejection bug.** In the `create_appointment` handler:
  - Coerce `intake_data` defensively: accept object, JSON-string, or `null`. Strip unknown keys against the company's industry intake schema instead of rejecting the whole insert.
  - On insert error, **retry once without `intake_data`** and return `{ success: true, appointment, intake_warning: "Saved without intake fields — staff will follow up." }` so the AI stops apologizing in a loop.
  - Log the exact Postgres error code/message so we can see future failures in edge logs.
- **Add a new tool `offer_slot_picker`** the AI calls when:
  - The customer asks to book but hasn't given a specific time, OR
  - `check_availability` / `find_next_available` returned multiple slots.
  - Returns `{ ui: "slot_picker", service_type, slots: [{datetime, label}, …], booking_token }` — the chat UI renders an inline card.
- **Add a new tool `offer_booking_form`** the AI calls when:
  - 2+ booking attempts have failed, OR
  - The industry pack requires intake fields the customer hasn't given, OR
  - The customer says "send me a form / link / picker".
  - Returns `{ ui: "booking_form_link", reason }`.
- Update the booking-agent system prompt: after one failed `create_appointment`, **must** call `offer_slot_picker` or `offer_booking_form` rather than re-trying silently. Never apologize twice in a row; offer a visual alternative.

### 2. Chat UI: `src/components/chat/CustomerChatInterface.tsx` and `src/components/ai/AIAgentConsole.tsx`

- New component `src/components/chat/InlineSlotPicker.tsx`:
  - Renders shadcn `Calendar` (date) + a horizontal list of time chips for that date.
  - Pulls slots from the tool result payload; on confirm, posts a synthetic user message ("Book me for Mon Jun 8, 8:00 AM") that the AI then turns into `create_appointment`.
- New component `src/components/chat/InlineBookingFormCard.tsx`:
  - Small card with "Open booking form →" button that calls `setActiveTab('book')` on the parent console (or, in the public widget, navigates to `/book/:companyId`).
- Message renderer in `CustomerChatInterface.tsx` / `AIAgentConsole.tsx` checks `message.tool_ui` and renders the right inline card. Falls back to plain markdown otherwise.

### 3. Hook plumbing: `src/hooks/useAIAgent.ts` (and `useMultiAgentChat.ts` if used here)

- When a tool result includes `{ ui: "slot_picker" | "booking_form_link" }`, attach it to the assistant message as `tool_ui` so the renderer can pick it up. No backend schema change.

### 4. BookingForm reuse

- Export `BookingForm` as-is; the inline form-fallback card just deep-links to the existing Book tab. No duplication.

### 5. Intake validation surface

- `src/lib/industryFormSchemas.ts` already lists required intake fields per industry. Add a thin helper `validateIntakeForIndustry(packId, intakeData)` returning `{ ok, missingFields }` and use it both in the chat agent (to decide when to call `offer_booking_form`) and in the edge function (to log warnings, not to reject).

## Out of scope

- Calendar sync / Google Calendar changes.
- Reworking the standalone `/book/:companyId` PublicBooking page.
- Voice agent booking flow (separate path; not in the screenshot).
- Changing tier gating — slot picker available wherever `create_appointment` is already enabled.

## Technical notes

- The inline slot picker uses the same `check_availability` results the agent already fetches — no new DB queries.
- `tool_ui` payload schema:
  ```ts
  type ToolUi =
    | { kind: 'slot_picker'; service_type: string; slots: { datetime: string; label: string }[] }
    | { kind: 'booking_form_link'; reason: string };
  ```
- The retry-without-intake fallback only triggers on Postgres insert errors mentioning `intake_data`, `jsonb`, or `column "intake_data"` — never silently drops other validation errors.
- New prompt rule (booking agent): *"If a create_appointment call fails twice, immediately call offer_booking_form. Never apologize more than once in a row without offering a visual alternative."*

## Verification

1. Reproduce the original failure with the same customer (Aletia / Platform Demo / Mon Jun 8 8:00 AM) in the preview — booking now succeeds, or falls back to the inline slot picker.
2. Tap a slot in the inline picker → appointment created → confirmation message.
3. Force a failure (e.g. industry with required intake the customer hasn't given) → AI posts the "Open booking form" card → tapping it switches to the Book tab.
4. Check edge function logs to confirm the exact Postgres error is being recorded.
