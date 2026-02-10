
# Update AI Agent Prompts for Virtual/Delivery-Type Awareness

## What This Does

The Field Ops AI agent prompts (dispatch, ETA, checkin) currently assume all jobs are in-person field service. Now that virtual and at-business appointments exist, these agents need to understand delivery types so they don't ask for addresses on virtual jobs or suggest routes for video calls.

The booking agent already handles delivery types correctly -- no changes needed there.

## Changes

### File: `supabase/functions/ai-agent-chat/index.ts`

#### 1. ETA Agent Prompt (most important)

The ETA agent handles job status updates for technicians. It needs to know that virtual jobs skip travel steps.

Add delivery-type awareness:
- When listing jobs via `get_my_jobs`, note that some may be virtual (delivery_type: "virtual") or at-business
- For virtual jobs: skip "en route" and "arrived" statuses -- go straight from "accepted" to "in_progress" to "completed"
- For virtual jobs with a `meeting_link`: mention the link to the technician
- Replace "technician arrival" language with "session" for virtual jobs

#### 2. Dispatch Agent Prompt

The dispatch agent collects customer info and assigns technicians. It should adapt for virtual emergencies:
- If the service being dispatched is virtual, skip the address collection step
- Replace "nearest available technician" with "next available staff" for virtual services
- Adjust the example response to mention "video session" or "phone call" instead of physical arrival for virtual jobs

#### 3. Checkin Agent Prompt

The checkin agent handles arrival verification and documentation. For virtual sessions:
- Skip "verify arrival at job site" for virtual appointments
- Replace with "verify session started" for virtual jobs
- Photo documentation may not apply to virtual sessions -- note this as optional

#### 4. Route Agent Prompt

Add a single line noting that route optimization only applies to in-person appointments. Virtual jobs should be excluded from route planning.

## What Stays the Same

- Booking agent -- already fully delivery-type aware
- Triage agent -- routes to other agents, no job-type-specific logic
- All tool definitions -- `get_my_jobs` already returns `delivery_type` and `meeting_link`
- No database changes needed
- No new dependencies

## Technical Details

All changes are within the `SYSTEM_PROMPTS` object in `supabase/functions/ai-agent-chat/index.ts`:

- **ETA prompt** (~lines 354-393): Add a "VIRTUAL JOB HANDLING" section explaining that virtual jobs skip en_route/arrived steps, and to surface the meeting_link when available
- **Dispatch prompt** (~lines 303-339): Add delivery-type check after collecting info -- skip address for virtual, adjust final response example
- **Checkin prompt** (~lines 395-409): Add note about virtual sessions not requiring physical check-in or photos
- **Route prompt** (~lines 341-352): Add one line that virtual jobs are excluded from route optimization
