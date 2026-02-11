

## Add "Accept" Button on Calendar + Pending Disclaimer on All Booking Channels

### Overview
Instead of requiring the Field Ops console to accept appointments, we'll add an **"Accept" button** directly on the calendar appointment card (when job status is `pending_acceptance`). We'll also add a **pending disclaimer** to the booking confirmation messages across all 3 channels (voice chat, phone AI, and AI chat) so customers know their appointment needs acceptance before it's confirmed.

---

### Part 1: Accept Button on Calendar Appointments

**File: `src/components/employee/AppointmentCalendar.tsx`**

1. **Add an "Accept Job" mutation** -- similar to the existing `completeMutation`, this will update `job_assignments.status` from `pending_acceptance` to `accepted` and send a confirmation notification to the customer.

2. **Add an "Accept" button on the appointment card** (the list view, lines 561-613) -- when `job_status === 'pending_acceptance'`, show a green "Accept" button below the Pending badge. Clicking it accepts the job without needing to open the detail dialog.

3. **Add an "Accept" button in the appointment detail dialog** (lines 636-788) -- when `job_status === 'pending_acceptance'`, show an "Accept Appointment" button alongside the existing Mark Complete and Cancel buttons.

4. **On accept, send confirmation notification** -- after updating the status, invoke `send-job-notification` with `notificationType: 'accepted'` and `recipientType: 'customer'` so the customer receives their confirmation.

---

### Part 2: Pending Disclaimer in Booking Responses

Update the success messages in all 3 booking channels to tell customers their appointment is pending acceptance:

**File: `supabase/functions/voice-booking-agent/index.ts`** (line 319)
- Change the message from "I've got that booked for you!" to include: "Please note, your appointment is pending confirmation. Once accepted, you'll receive a confirmation message."

**File: `supabase/functions/voice-swaig/index.ts`** (line 294)
- Update the phone AI response to include the same pending disclaimer.

**File: `supabase/functions/ai-agent-chat/index.ts`** (line 3790)
- Update the chat agent response message to include the pending disclaimer.

---

### Technical Details

**Accept mutation logic (AppointmentCalendar.tsx):**
```text
1. Update job_assignments SET status = 'accepted' WHERE id = job_id
2. Invoke send-job-notification with notificationType 'accepted', recipientType 'customer'
3. Invalidate calendar query to refresh UI
4. Show success toast
```

**Accept button placement on card:**
- Renders below the "Pending" badge on the right side of the appointment card
- Small green button with CheckCircle icon and "Accept" text
- Stops event propagation so clicking Accept doesn't open the detail dialog

**Accept button in detail dialog:**
- Appears above the existing "Mark Complete" / "Cancel" row when job_status is `pending_acceptance`
- Full-width green button

**Disclaimer text (consistent across all channels):**
> "Your appointment is pending confirmation. Once accepted by our team, you'll receive a confirmation with all the details."

### Files to Modify
- `src/components/employee/AppointmentCalendar.tsx` -- Add accept mutation, accept button on card and in detail dialog
- `supabase/functions/voice-booking-agent/index.ts` -- Update success message with pending disclaimer
- `supabase/functions/voice-swaig/index.ts` -- Update success message with pending disclaimer
- `supabase/functions/ai-agent-chat/index.ts` -- Update success message with pending disclaimer

