

# Fix: Appointment Times Showing 6:30 AM Instead of 12:30 PM

## Problem
Appointment times are stored in the database as UTC (e.g., `12:30:00+00`). When the browser creates a `new Date()` from this value, JavaScript converts it to local time (CST = UTC-6), displaying **6:30 AM** instead of the intended **12:30 PM**.

This affects **~15 files** across the project wherever appointment times are displayed.

## Solution
Create a centralized utility function that parses the datetime string and extracts the UTC components directly, bypassing JavaScript's automatic timezone conversion. Then replace all `new Date(datetime)` usages for display formatting with this utility.

## Implementation Steps

### Step 1: Create a UTC date helper utility
Add a helper function in `src/lib/dateUtils.ts` (new file):
- `parseUTCDateTime(datetime: string): Date` - Parses a UTC datetime string and returns a Date object where the local time components match the UTC values (effectively treating UTC as local time for display purposes).
- This prevents the timezone shift by adjusting the Date object by the local timezone offset.

### Step 2: Update all 15 files to use the helper
Replace `new Date(appointment.datetime)` with `parseUTCDateTime(appointment.datetime)` in all display-related formatting calls across these files:

1. `src/components/employee/AppointmentCalendar.tsx` (~8 occurrences)
2. `src/components/booking/BookingAgentConsole.tsx` (~4 occurrences)
3. `src/components/employee/FieldOpsAgentConsole.tsx`
4. `src/pages/CustomerDashboard.tsx`
5. `src/components/fieldops/FieldOpsConsole.tsx`
6. `src/components/employee/CompletedJobsHistory.tsx`
7. `src/components/ai/AppointmentTrackingView.tsx`
8. `src/components/company/CompanyJobQueue.tsx`
9. And remaining files with similar patterns

### Step 3: Update date comparison logic
For filtering (e.g., `isSameDay`), also use the UTC-preserving parser so calendar date highlighting matches correctly.

## Technical Details

The helper function approach:
```typescript
export function parseUTCDateTime(datetime: string): Date {
  const d = new Date(datetime);
  // Add the timezone offset so local display matches the stored UTC value
  return new Date(d.getTime() + d.getTimezoneOffset() * 60000);
}
```

This is a single-line fix per call site (import + find-replace), ensuring all appointment times display the originally intended time regardless of the user's timezone.

