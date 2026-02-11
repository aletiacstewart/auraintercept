

## Fix: Wrong Dates and Missing Calendar Entries from Voice Bookings

### Problem 1: Wrong Dates
The ElevenLabs agent doesn't know today's date, so when you say "tomorrow at 2pm," it guesses incorrectly (e.g., May 16th instead of February 12th).

### Problem 2: Appointments Not Appearing in Calendar
The voice booking agent creates the appointment row but never creates a corresponding `job_assignments` record with `status: 'pending_acceptance'`. Without this record, the appointment is invisible in the technician dashboard and Field Ops console.

---

### Fix 1: Inject Today's Date After Connection (VoiceChat.tsx)

After `conversation.startSession()` succeeds, send a silent contextual update telling the agent today's date:

```typescript
// After startSession (line ~166)
const today = new Date();
const formatted = today.toLocaleDateString('en-US', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
});
conversation.sendContextualUpdate(
  `Today's date is ${formatted} (${today.toISOString().split('T')[0]}).`
);
```

### Fix 2: Server-Side Date Resolution Fallback (voice-booking-agent)

In the `check_availability` handler, resolve relative terms ("today", "tomorrow") server-side as a safety net:

```typescript
if (preferredDate.toLowerCase() === "tomorrow") {
  const d = new Date(); d.setDate(d.getDate() + 1);
  targetDate = d.toISOString().split("T")[0];
} else if (preferredDate.toLowerCase() === "today") {
  targetDate = new Date().toISOString().split("T")[0];
}
```

### Fix 3: Create job_assignments Record on Booking (voice-booking-agent)

After successfully inserting the appointment, also insert a `job_assignments` record so it appears in the calendar and technician queue:

```typescript
// After appointment insert succeeds (line ~261)
await supabase.from('job_assignments').insert({
  company_id: companyId,
  appointment_id: appointment.id,
  status: 'pending_acceptance',
});
```

This matches the pattern used in the widget-api for web bookings.

---

### Files to Modify
- **`src/components/ai/VoiceChat.tsx`** -- Add `sendContextualUpdate` with today's date after session starts
- **`supabase/functions/voice-booking-agent/index.ts`** -- Add relative date resolution + job_assignments insert after appointment creation

