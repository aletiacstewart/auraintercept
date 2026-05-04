## Problem

Restaurants are correctly configured at the data layer (`industry_blueprints.restaurants` has `restrictions.booking=false`, `dispatch=false`, and a script override telling Aura to text a booking link). But several user-facing surfaces still imply that we accept reservations / bookings inside the app:

1. **Voice greeting** (`src/lib/industryVoiceGreetings.ts:32`)
   `"…would you like a reservation, takeout, or info about an event?"` — implies Aura books reservations.
2. **Aura suggestions** (`src/lib/industryAuraSuggestions.ts:84-91`)
   Includes `"What's tonight's reservation count?"` and `"How many no-shows this week?"` — only valid if we owned reservations.
3. **SMS templates** (`src/lib/industryTemplates.ts:496-499`)
   `"Your reservation is confirmed for {date} at {time}…"` — we never confirm reservations.
4. **Demo seed sample appointment** (`supabase/functions/create-demo-trial/index.ts`)
   Seeds a `Reservation (party of 6)` appointment row for restaurant demos.
5. **Console title for restaurants** (`industryAgentMap.ts:449`)
   Currently `"Guest Flow Console"` with badge "Built for reservations, inquiries, and smart links" — drop the "reservations" word.

The chat portal action `"Book a Table"` is OK because its prompt is `"Send me the link to book a table."` (Smart Link), but the label can be clearer as `"Booking Link"`.

## Fix

### 1. Voice greeting → Smart Link framing
```ts
restaurants: 'Thanks for calling {company}. This is Aura — I can text you a link to book a table, view our menu, hours, or catering info. What would you like?',
```

### 2. Aura suggestions → reframe to what we DO know
Replace reservation-centric suggestions with Smart-Link / inbound-traffic metrics:
- "How many menu links did Aura send this week?"
- "How many catering inquiries came in?"
- "What is my missed-call recovery rate?"
- "Show me top inbound questions this week."
- "What is my review score this month?"
- "Which Smart Link gets clicked most?"

### 3. SMS templates → Smart Link prompts (no confirmation copy)
```ts
sms: [
  "Hi {name}! Here's the link to book your table: {link}",
  "Thanks for calling {company}! Menu: {link}",
],
```

### 4. Demo seed → swap reservation appointment for a catering inquiry lead
In `create-demo-trial/index.ts` restaurants entry, drop the `sampleAppointment` (or convert to a `Catering Inquiry` lead so we don't seed a reservation row).

### 5. Console badge / wording
In `src/lib/industryAgentMap.ts` `restaurants` override:
- `consoleBadge: 'Built for inbound calls, Smart Links, and follow-up'`
- (Keep `Guest Flow Console` title — it's accurate without booking implication.)

### 6. Portal quick-action label
`PortalQuickActions.tsx`: change restaurants `'Book a Table'` → `'Get Booking Link'` (prompt unchanged — already Smart-Link based).

### 7. Memory update
Append to `mem://features/industry/restaurants-smart-link-only`:
- Voice greeting must NOT offer reservations directly.
- Aura suggestions and SMS templates must reference Smart Links / inbound metrics, not confirmed reservations.
- Demo seeds must not insert reservation appointments for the restaurants vertical.

## Files Touched

- `src/lib/industryVoiceGreetings.ts`
- `src/lib/industryAuraSuggestions.ts`
- `src/lib/industryTemplates.ts`
- `src/lib/industryAgentMap.ts`
- `src/components/customer-portal/PortalQuickActions.tsx`
- `supabase/functions/create-demo-trial/index.ts`
- `mem://features/industry/restaurants-smart-link-only`

## Out of Scope

- Backend `industry_blueprints.restaurants` row — already correct (`booking: false`).
- `aura-unified` snippet — already injects the "Do NOT offer to book" instruction.
- Reservation-related code paths in shared booking/calendar logic — restaurants already short-circuit via `restrictions.booking=false`.

Approve and I'll switch to build mode and apply this in one pass.