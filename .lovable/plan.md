
# Virtual Job Acceptance: Send Meeting Details Only After Employee Confirms

## What This Does
Right now, when a virtual appointment is booked, the customer immediately gets a generic confirmation. The employee still needs to accept the job, but the customer never receives the meeting link or call details.

This update ensures:
1. Virtual jobs still go through the normal **accept** flow (employee must accept first)
2. Only **after** the employee accepts does the system generate a Google Meet link (or prepare phone call info) and send it to the customer
3. The customer gets a clear message: "Your video session link is: [link]" or "We will call you at [phone] on [date/time]"

## Implementation Steps

### Step 1: Add `delivery_type` and `meeting_link` columns to appointments table
- `delivery_type` (text, default `in_person_customer`) -- copied from the service at booking time
- `meeting_link` (text, nullable) -- stores the Google Meet URL after generation

### Step 2: Store `delivery_type` on appointment creation
Update `booking-actions` and `ai-agent-chat` so when an appointment is created, the service's `delivery_type` is looked up and saved on the appointment record.

### Step 3: Trigger Google Meet link generation on job acceptance
Update `send-job-notification` so that when `notificationType` is `accepted` and the appointment's `delivery_type` is `virtual`:
- Call `google-calendar-sync` with `conferenceDataVersion=1` to create a Google Meet link
- Save the returned `hangoutLink` to `appointments.meeting_link`
- Include the meeting link in the "accepted" SMS/email sent to the customer

If Google Calendar isn't connected, fall back to phone call messaging: "We will call you at [your phone] on [date] at [time]."

### Step 4: Update notification templates for virtual jobs
Modify `generateMessages()` in `send-job-notification` to be delivery-type-aware:
- **Virtual + meeting link**: "Your appointment is confirmed! Join your video session here: [link]"
- **Virtual + no link (phone call)**: "Your appointment is confirmed! We will call you at [phone] on [date] at [time]"
- **In-person at business**: "Your appointment is confirmed! Visit us at [address]"
- **In-person at customer**: Keep current behavior ("technician is heading to you")

Also skip irrelevant notifications for virtual jobs (e.g., don't send `en_route` or `arrived` notifications).

### Step 5: Update Google Calendar sync to support conference data
Modify `google-calendar-sync/index.ts` to:
- Accept a `requestConference` flag
- Add `conferenceDataVersion=1` to the API URL
- Include `conferenceData.createRequest` in the event body
- Return `hangoutLink` from the response

### Step 6: Update Field Ops console quick actions for virtual jobs
Modify `FieldOpsAgentConsole.tsx` so when the selected job's delivery type is `virtual`:
- Hide "Directions", "En Route", "Arrive" buttons
- Show "Start Virtual Session" (opens the meeting link) and "Complete"
- The "Accept" button works the same way for all job types

### Step 7: Show meeting link in customer-facing pages
Update `CustomerPortal.tsx` and `CustomerDashboard.tsx` to display a "Join Meeting" button when an appointment has a `meeting_link` value.

## Technical Details

### Data flow
```text
Service (delivery_type: "virtual")
  -> Booking creates Appointment (delivery_type: "virtual", meeting_link: null)
    -> Job Assignment created (status: "pending_acceptance")
      -> Employee accepts job
        -> send-job-notification (type: "accepted")
          -> If virtual: call google-calendar-sync with conferenceData
            -> Save meeting_link to appointment
          -> SMS/Email to customer includes meeting link or phone call info
```

### Files to create/modify
1. **Database migration** -- add `delivery_type` and `meeting_link` to `appointments`
2. **`supabase/functions/booking-actions/index.ts`** -- store `delivery_type` from service
3. **`supabase/functions/ai-agent-chat/index.ts`** -- store `delivery_type` on appointment creation
4. **`supabase/functions/send-job-notification/index.ts`** -- trigger Meet link generation on acceptance for virtual jobs, update all notification templates
5. **`supabase/functions/google-calendar-sync/index.ts`** -- add conferenceData support, return hangoutLink
6. **`src/components/employee/FieldOpsAgentConsole.tsx`** -- conditional quick actions for virtual jobs
7. **`src/pages/CustomerPortal.tsx`** -- "Join Meeting" button
8. **`src/pages/CustomerDashboard.tsx`** -- meeting link display

### No breaking changes
- Default `delivery_type` is `in_person_customer` -- all existing appointments keep current behavior
- Google Meet links only generated for virtual services when Google Calendar is connected
- Phone call fallback works without any extra integration
- The accept flow remains identical for all job types -- only what happens after acceptance differs
