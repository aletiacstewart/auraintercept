

## Fix: Availability Check and Booking for Phone AI and Web Voice Chat

### Root Cause

There are two separate edge functions handling availability, and one of them is completely broken:

1. **`voice-swaig`** (phone AI): Has proper availability logic -- queries technician assignments, checks `availability_json`, generates hourly slots, filters out conflicts. This works correctly but uses `['pending', 'confirmed', 'in-progress', 'scheduled']` status filter which is good.

2. **`voice-booking-agent`** (web voice chat): The `check_availability` handler is broken. It only counts existing appointments and returns a generic message like "There are 2 existing appointments this week. Business hours are configured." It never actually queries technician availability, never checks `availability_json`, and never returns available time slots. The AI agent receives no usable data and tells the user there are no times available.

### Fix

**File: `supabase/functions/voice-booking-agent/index.ts`**

Rewrite the `check_availability` case to mirror the working logic from `voice-swaig`:

1. Query `employee_job_assignments` for technicians in the company
2. Query `profiles` for those employees' `availability_json`
3. Parse the preferred date to get the day of week
4. Generate hourly time slots based on `availability_json` ranges
5. Filter out slots that conflict with existing appointments (using status filter `['pending', 'confirmed', 'in-progress', 'scheduled']`)
6. Return the actual available time slots (up to 5) in a structured response
7. If no slots on the requested date, scan the next 14 days for alternatives (same fallback logic as `voice-swaig`)

This gives the ElevenLabs web voice agent real slot data to work with, enabling it to offer specific times and book appointments.

### Technical Details

The rewritten `check_availability` case will:

```text
1. Get technician assignments for companyId
2. Get profiles with availability_json for those employee IDs
3. Parse preferred_date (or default to tomorrow)
4. Map date to day name (monday, tuesday, etc.)
5. For each employee's availability slots on that day:
   - Generate hourly time slots (e.g., 08:00, 09:00, ...)
   - Filter out conflicts with existing appointments
6. Return unique slots (max 5) with a human-readable message
7. If none found, scan next 14 days and suggest alternatives
```

### Files Changed

- `supabase/functions/voice-booking-agent/index.ts` -- Rewrite `check_availability` with real slot-finding logic

