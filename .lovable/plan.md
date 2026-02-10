

# Fix: Bookings Not Appearing in Job Queue

## The Problem

When appointments are booked via the phone AI agent (voice-swaig), only an `appointments` record is created -- **no `job_assignments` record is created**. The technician dashboard and Field Ops console query `job_assignments`, so these bookings are invisible to staff.

Additionally, some appointments have no `employee_id`, meaning they're completely unassigned.

## Root Cause

In `supabase/functions/voice-swaig/index.ts` (the `book_appointment` handler, lines 244-257), the code:
1. Creates an appointment in the `appointments` table
2. Syncs to Google Calendar
3. ...but **never creates a `job_assignments` row**

Compare this to the AI chat booking flow (`ai-agent-chat`), which correctly creates both an appointment AND a job assignment.

## The Fix

### Step 1: Create job assignment after booking in `voice-swaig`

After the appointment insert succeeds (line 257), add logic to create a corresponding `job_assignments` row -- matching the pattern used in `ai-agent-chat`:

```typescript
// After appointment creation succeeds...
if (appointment?.id) {
  const jobData: any = {
    company_id: companyId,
    appointment_id: appointment.id,
    status: 'pending_acceptance',
  };
  if (employeeId) {
    jobData.employee_id = employeeId;
  }
  const { error: jobError } = await supabase
    .from('job_assignments')
    .insert(jobData);
  if (jobError) {
    console.error('Failed to create job assignment:', jobError);
  }
}
```

### Step 2: Fix existing orphaned appointments

Run a one-time data fix to create `job_assignments` for the existing appointments that are missing them:

```sql
-- Create job assignments for appointments that don't have one
INSERT INTO job_assignments (company_id, appointment_id, employee_id, status)
SELECT a.company_id, a.id, a.employee_id, 'pending_acceptance'
FROM appointments a
LEFT JOIN job_assignments ja ON ja.appointment_id = a.id
WHERE ja.id IS NULL
  AND a.company_id = '04c57cbe-358e-4036-a3ad-b777a55f5be0'
  AND a.status != 'cancelled';
```

### Step 3: Ensure delivery-type-aware actions in job queue

The `TechnicianJobQueue.tsx` already has accept/decline buttons for all pending jobs regardless of delivery type. After accepting:
- For `virtual` or `in_person_business` jobs, the "En Route" / "Directions" steps are already hidden in the Field Ops console
- The flow goes: Accept --> Start Session --> Complete

No UI changes are needed -- the accept button already works for all delivery types. The only issue was that jobs weren't being created in the first place.

## Summary

| What | Change |
|------|--------|
| `voice-swaig/index.ts` | Add `job_assignments` insert after appointment creation |
| Database | One-time fix for existing orphaned appointments |
| UI | No changes needed -- accept flow already supports all delivery types |

