
## Fix Booking Agent: No Availability + Add Smart Suggestions

### Problem
The booking agent says "no available dates or times" because:
1. The admin profile has no `technician` job assignment -- the booking engine only considers employees with `job_type = 'technician'`
2. The admin's `availability_json` has empty arrays for every day -- so even with the assignment, zero time slots are generated
3. When no slots are found, the agent just asks the customer to pick a new date instead of automatically finding the next available one

### Fix (3 parts)

**Part 1: Data fix -- Add technician assignment + availability**
- Insert a `technician` row into `employee_job_assignments` for the admin (`5e877645...`) with company `04c57cbe...`
- The admin keeps their `platform_admin` role in `user_roles` (unchanged) -- the technician assignment is a separate job role concept
- Update the admin's `availability_json` to have working hours (08:00-18:00) for Monday-Saturday and 10:00-16:00 for Sunday, matching the configured business hours

**Part 2: Add `find_next_available` action to `booking-actions` edge function**
- New action that loops through the next 14 days starting from a given date
- For each day, calls the existing `checkAvailability` logic internally
- Returns the first 3 dates that have open slots, along with top time slots for each
- This gives the AI agent concrete suggestions when a requested date has no availability

**Part 3: Wire up AI agent to auto-suggest alternatives**
- Add a `find_next_available` tool definition in `ai-agent-chat/index.ts`
- Add execution handler that calls the booking-actions endpoint with the new action
- Update the booking agent prompt to instruct: "If check_availability returns zero slots, immediately call find_next_available and present the closest dates with open slots. Do NOT ask the customer to guess another date."

### Files modified
- `supabase/functions/booking-actions/index.ts` -- add `find_next_available` action + case in switch
- `supabase/functions/ai-agent-chat/index.ts` -- add tool definition, execution handler, prompt update
- Database: insert into `employee_job_assignments`, update `profiles.availability_json`
