# Wire Real Business Events Into Agent Orchestrator

Implement all three fixes in order.

## Fix 1 — `supabase/functions/booking-actions/index.ts`

Inside `bookAppointment`, after the `appointments` insert succeeds and alongside the existing `send-appointment-email` / `send-appointment-sms` / `send-staff-notification` fire-and-forget calls, add a fire-and-forget POST to `${supabaseUrl}/functions/v1/ai-orchestrator`:

```
action: 'emit_event',
companyId,
agentType: 'booking_system',
eventType: 'appointment_booked',
payload: {
  appointment_id: appointment.id,
  customer_id: appointment.customer_id ?? null,
  customer_name: params.customerName,
  service_type: appointment.service_type,
  scheduled_at: appointment.datetime,
  total_amount: appointment.total_amount ?? null,
}
```

Uses the real inserted `appointment` row. `.catch(err => console.error(...))` so orchestrator failures never block the booking response. Auth header uses `SUPABASE_SERVICE_ROLE_KEY` (already used elsewhere in the file).

## Fix 2 — `supabase/functions/send-job-notification/index.ts`

After the appointment fetch (line ~94, `appointment` in scope), map:

```
assigned  -> tech_assigned
completed -> job_complete
```

For those two only, POST to `ai-orchestrator` with `agentType: 'field_navigation'` and payload `{ appointment_id, job_assignment_id: jobAssignmentId, service_type, completed_at }`. Skip emit for `accepted`/`en_route`/`arrived` (no matching `EVENT_ROUTING`). Same fire-and-forget + `.catch`. Existing customer/tech notification code untouched — no duplicate messages.

## Fix 3 — new `supabase/functions/stripe-webhook/index.ts`

New function:
1. Verifies Stripe signature with `STRIPE_WEBHOOK_SECRET` via `constructEventAsync` (required in Deno).
2. `checkout.session.completed` → emit `payment_received` `{ session_id, amount_total, currency }`, keyed off `session.metadata.company_id` (already set by `create-checkout`).
3. `invoice.paid` → emit `invoice_paid` `{ invoice_id, amount_paid, currency }`, keyed off `invoice.metadata.company_id` or `subscription_details.metadata.company_id`.
4. Any other event → log + 200.
5. Signature failure → 400. That signature check is the security boundary.

Add `[functions.stripe-webhook] verify_jwt = false` to `supabase/config.toml`.

**Secret:** request `STRIPE_WEBHOOK_SECRET` via `add_secret` (user obtains it from Stripe Dashboard when registering the endpoint). `STRIPE_SECRET_KEY` is already configured.

**User-side (manual, out of code):** in Stripe Dashboard → Developers → Webhooks, add endpoint `https://zwlcwtgjvesbevheknbk.supabase.co/functions/v1/stripe-webhook` subscribed to `checkout.session.completed` + `invoice.paid`; paste the signing secret when prompted for it.

## Explicitly out of scope

- The other ~22 events in `EVENT_ROUTING` — wire incrementally after verifying these three.
- Whether receiving operatives actually act on the events (separate gap to surface after emission is confirmed).
- Replacing `check-subscription` polling with webhook-driven subscription state.

## Acceptance

- Real booking → `ai_agent_events` row with `event_type='appointment_booked'` and real `appointment_id`.
- Real job completed → `job_complete` event row with real IDs.
- Test-mode Stripe checkout → webhook fires, signature verifies, `payment_received` row with real session id/amount.
- Exactly one customer confirmation email + SMS per booking (no duplicates).
