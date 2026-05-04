---
name: Restaurants Vertical — Smart Link Only (No Reservation System)
description: Restaurants do NOT use the in-app reservation system; voice/chat send Smart Links to the restaurant's external booking page, menu, hours, and catering forms
type: feature
---
**Restaurants vertical scope is voice + chat + Smart Links only.** Aura does not store or manage reservations in the platform.

**What restaurants get:**
- Voice agent that answers calls and **texts a Smart Link** to the customer's booking page, menu, hours, location, or catering form.
- Chat widget on the website that does the same.
- `menu_writer` and `review_responder` specialists.

**What restaurants do NOT get (and must not be built):**
- In-app "Make a Reservation" / "My Reservations" forms.
- `reservation_optimizer` specialist (removed from restaurant specialist lists).
- Reservation backfill / waitlist mechanics.
- Voice greetings that offer to take a reservation directly (must offer to **text a link** instead).
- Aura suggestion prompts referencing reservation counts, no-shows, top servers, or covers (use Smart Link / inbound / review metrics).
- SMS templates that confirm reservations (only Smart Link delivery copy).
- Demo seed data that inserts a sample reservation appointment row.

**Affected files:**
- `src/components/customer-portal/PortalQuickActions.tsx` — restaurant actions are Get Booking Link / Menu Link / Hours / Catering, all Smart Link prompts.
- `src/pages/ai-consoles/MarketingSalesConsole.tsx` and `CustomerPortalConsole.tsx` — restaurants specialist list = `['menu_writer', 'review_responder']`.
- `src/lib/industryFieldOpsWorkflows.ts` — restaurants workflows are Menu/Hours Update, Missed-Call Recovery (Smart Link), Review Pulse.
- `src/lib/industryVoiceGreetings.ts` — restaurants greeting frames Aura as a Smart Link sender.
- `src/lib/industryAuraSuggestions.ts` — restaurants suggestions are Smart Link / inbound / review focused.
- `src/lib/industryTemplates.ts` — restaurants SMS templates are Smart Link delivery only.
- `supabase/functions/create-demo-trial/index.ts` — restaurants demo seeds a catering inquiry lead, NOT a reservation appointment.

Keep this scope when adding any new restaurant feature.
