

## Fix Booking Agent: No Availability + Smart Suggestions

### Problem
Three issues are causing the booking agent to fail:

1. **No technician assignments** -- The `employee_job_assignments` table is completely empty. The booking engine only considers employees with `job_type = 'technician'`, so it finds zero eligible staff and returns "no availability."

2. **Empty availability schedules** -- The admin profile (`5e877645...`) has empty arrays for every day in `availability_json`. Even with a technician assignment, no time slots would be generated.

3. **No fallback when slots are empty** -- When `check_availability` returns zero slots, the agent just says "try another date" instead of proactively finding the next available date.

### Fix (3 Parts)

**Part 1: Data fix (database migration)**
- Insert a `technician` row into `employee_job_assignments` for the admin profile (`5e877645-4201-49f5-9fca-9efe06548ff9`) with company `04c57cbe-358e-4036-a3ad-b777a55f5be0`
- The admin keeps their `platform_admin` role in `user_roles` -- that is unchanged. The technician assignment is a separate job-role concept used only by the booking engine.
- Update `profiles.availability_json` for the admin to have working hours: 08:00-18:00 Monday-Saturday, 10:00-16:00 Sunday

**Part 2: Add `find_next_available` action to booking-actions edge function**
- New action in `supabase/functions/booking-actions/index.ts`
- Loops through the next 14 days starting from a given date
- For each day, calls the existing `checkAvailability` logic internally
- Returns the first 3 dates that have open slots, with sample time slots for each
- Gives the AI agent concrete suggestions when a requested date has no availability

**Part 3: Wire up AI agent to auto-suggest alternatives**
- Add a `find_next_available` tool definition in `supabase/functions/ai-agent-chat/index.ts`
- Add execution handler in the tool switch that calls booking-actions with the new action
- Update the booking agent system prompt to instruct: "If check_availability returns zero slots, immediately call find_next_available and present the closest dates with open slots. Do NOT ask the customer to guess another date."

### Files Modified
- `supabase/functions/booking-actions/index.ts` -- add `find_next_available` case in switch + implementation
- `supabase/functions/ai-agent-chat/index.ts` -- add tool definition, execution handler, prompt update
- Database migration: insert into `employee_job_assignments`, update `profiles.availability_json`

