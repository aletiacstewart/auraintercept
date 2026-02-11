

## Add Decline and Reschedule Buttons to Calendar and Field Ops Console

### Question 1: How Do Lower-Tier Plans See Appointments?

The `/dashboard/appointments` page (which includes the AppointmentCalendar with the new Accept button, Job Queue, and History tabs) is already accessible to **all roles and all tiers** -- there's no tier gate on it. Company admins on Starter or Scheduling plans can see and manage appointments there. The sidebar shows "My Schedule" for employees and the Appointments page is available to company admins. So this is already covered -- no changes needed.

### Question 2: Add Decline and Reschedule

We'll add **Decline** and **Reschedule** buttons in two places:

---

### Part A: AppointmentCalendar (all tiers)

**File: `src/components/employee/AppointmentCalendar.tsx`**

1. **Add a `declineMutation`** -- Updates `job_assignments.status` to `'declined'` and the appointment status to `'cancelled'`, then sends a cancellation notification to the customer.

2. **Add a Reschedule dialog** -- A new dialog with a date/time picker that updates the appointment's `datetime` field and notifies the customer of the new time.

3. **On the appointment card** (list view, lines 624-642) -- Add a red "Decline" button next to the existing green "Accept" button when `job_status === 'pending_acceptance'`.

4. **In the appointment detail dialog** (lines 793-806) -- Add "Decline" and "Reschedule" buttons alongside the existing "Accept Appointment" button when `job_status === 'pending_acceptance'`. Also add a "Reschedule" option for accepted/scheduled appointments.

5. **Add a decline confirmation AlertDialog** -- similar to the existing cancel confirmation dialog, asking "Are you sure you want to decline this appointment?"

6. **Add a reschedule dialog** -- with a calendar date picker and time input, pre-filled with the current appointment date/time.

---

### Part B: FieldOpsAgentConsole (Field Ops tier)

**File: `src/components/employee/FieldOpsAgentConsole.tsx`**

1. **Add a "Decline" quick action** to `QUICK_ACTIONS` array and `TABS` -- A new tab/button with an X icon that opens the job selector filtered to `pending_acceptance` jobs.

2. **Add a `handleSelectJobForDecline` handler** -- Updates `job_assignments.status` to `'declined'`, updates the appointment to `'cancelled'`, sends notification, and informs the AI chat.

3. **Add a "Reschedule" quick action** to `QUICK_ACTIONS` and `TABS` -- Opens a job selector, then shows a date/time picker to set the new appointment time.

4. **Add a `handleSelectJobForReschedule` handler** -- Updates the appointment's datetime, sends notification to the customer with the new time.

5. **Update `SelectorMode` type** to include `'decline'` and `'reschedule'`.

6. **Update `getSelectorConfig`** to add selector configs for decline and reschedule modes.

---

### Technical Details

**Decline flow:**
```text
1. User clicks "Decline" on a pending_acceptance job
2. Confirmation dialog appears
3. On confirm:
   a. Update job_assignments SET status = 'declined'
   b. Update appointments SET status = 'cancelled'
   c. Invoke send-job-notification with notificationType 'cancelled', recipientType 'customer'
   d. Invalidate queries / refetch jobs
   e. Show success toast
```

**Reschedule flow:**
```text
1. User clicks "Reschedule" on any active appointment
2. Reschedule dialog opens with date picker + time input
3. On submit:
   a. Update appointments SET datetime = new_datetime
   b. Invoke send-appointment-email with type 'reschedule'
   c. Invoke send-appointment-sms with type 'reschedule'
   d. Invalidate queries / refetch jobs
   e. Show success toast
```

**New icons needed:** `XCircle` (already imported), `CalendarClock` from lucide-react for reschedule.

### Files to Modify
- `src/components/employee/AppointmentCalendar.tsx` -- Add decline mutation, reschedule mutation, decline confirmation dialog, reschedule dialog, buttons on card and detail views
- `src/components/employee/FieldOpsAgentConsole.tsx` -- Add decline/reschedule quick actions, tabs, handlers, selector configs

