

## Fix: AI Voice Chat and Phone Calls Cannot Access Services or Book Appointments

### Root Cause

Both the web voice chat (`voice-booking-agent`) and phone call AI (`voice-swaig`) edge functions query the `employee_job_assignments` table with `.select("employee_id, services")`, but the `services` column does **not exist** on that table. This causes the database query to fail, returning `null`, which triggers the "No team members available" response -- preventing both service lookup and appointment booking.

### Affected Functions

1. **`supabase/functions/voice-booking-agent/index.ts`** (line 75) -- Web voice chat (ElevenLabs)
2. **`supabase/functions/voice-swaig/index.ts`** (line 91) -- Phone call AI (SignalWire SWAIG)

### Fix

Remove the non-existent `services` column from both SELECT queries. Neither function actually uses it after fetching:

**voice-booking-agent/index.ts line 75:**
- Change: `.select("employee_id, services")` 
- To: `.select("employee_id")`

**voice-swaig/index.ts line 91:**
- Change: `.select('employee_id, services')`
- To: `.select('employee_id')`

### Verification

After deploying, both functions will:
- Successfully query technician assignments
- Return available services via `get_services`
- Return valid appointment slots via `check_availability`
- Successfully book appointments via `book_appointment` / `create_appointment`

### Technical Note

The `employee_job_assignments` table has these columns: `id`, `company_id`, `employee_id`, `job_type`, `assigned_by`, `assigned_at`. No `services` column exists. The functions only use `employee_id` from this query, so removing `services` from the select has zero impact on logic.
