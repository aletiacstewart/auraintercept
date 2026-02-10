

# Sync All Bookings to Google Calendar Automatically

## The Problem

When an appointment is created (via AI chat, phone call, or web booking), it gets saved to the database and triggers SMS notifications -- but it is **never synced to Google Calendar**. The only place `google-calendar-sync` is called today is inside `send-job-notification`, and only for **virtual appointments** that need a Google Meet link.

## The Fix

Add a Google Calendar sync call inside the `create_appointment` tool handler in `ai-agent-chat/index.ts`, right after the appointment is created and notifications are sent. This covers ALL booking channels (web chat, phone, voice agent) since they all funnel through this same tool.

### File: `supabase/functions/ai-agent-chat/index.ts`

After the SMS confirmation block (~line 3753), add a call to `google-calendar-sync` with `action: 'sync_appointment'`:

```typescript
// Sync to Google Calendar (if connected)
try {
  await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/google-calendar-sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
    },
    body: JSON.stringify({
      action: 'sync_appointment',
      companyId: companyId,
      appointmentId: appointment.id,
      appointment: appointment,
    }),
  });
  console.log('[AI Agent] Google Calendar sync triggered for appointment:', appointment.id);
} catch (calendarError) {
  console.error('[AI Agent] Google Calendar sync error (non-blocking):', calendarError);
}
```

This is **non-blocking** -- if the company doesn't have Google Calendar connected, the sync function returns early with "No Google Calendar connection" and the booking still succeeds normally.

### File: `supabase/functions/voice-booking-agent/index.ts`

The voice booking agent has its own `create_appointment` handler that also inserts directly into the database. Add the same Google Calendar sync call there after appointment creation, so phone bookings via ElevenLabs also sync.

## What This Covers

| Booking Source | Creates Appointment | Syncs to Google Calendar |
|---------------|--------------------|-----------------------|
| Web AI Chat | Yes (ai-agent-chat) | Yes (after fix) |
| Phone AI Agent | Yes (ai-agent-chat) | Yes (after fix) |
| Voice Booking (ElevenLabs) | Yes (voice-booking-agent) | Yes (after fix) |
| Manual (web UI) | Yes (direct insert) | Already works via send-job-notification for virtual |

## How It Works

The existing `google-calendar-sync` function already handles everything:
- Checks if the company has a Google Calendar connection
- Refreshes OAuth tokens if expired
- Creates/updates the event on Google Calendar
- Saves the mapping in `calendar_event_mappings`
- Generates Google Meet links for virtual appointments

We just need to **call it** from the appointment creation flows. No changes to the sync function itself.

## No Database Changes Needed

The `google_calendar_connections`, `calendar_event_mappings`, and `appointments` tables already have all the required columns.

