

# Fix: Booking Agent "Business Closed" Error

## Root Cause
The `booking-actions` edge function queries the `business_hours` table using `.single()`, but the table contains **multiple hour types** per day (regular, office, field, emergency). This causes the query to fail, returning `null` and triggering the "closed" message.

## Solution
Update the business hours query to:
1. Filter for appropriate hour types (`regular` or `office`)
2. Check if **any** matching hour type is open
3. Use the open hours for slot calculation

---

## Technical Changes

### File: `supabase/functions/booking-actions/index.ts`

**Lines 287-298** - Update the business hours query:

```text
Before:
const dayOfWeek = new Date(date).getDay();
const { data: hours } = await supabase
  .from('business_hours')
  .select('*')
  .eq('company_id', companyId)
  .eq('day_of_week', dayOfWeek)
  .single();

if (!hours || hours.is_closed) {
  return { success: true, available_slots: [], message: 'Business is closed on this day' };
}

After:
// Parse date properly using local components to avoid timezone issues
const dateParts = date.split('-');
const targetDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
const dayOfWeek = targetDate.getDay();

// Get ALL hour types for this day (regular, office, field, emergency)
const { data: allHours } = await supabase
  .from('business_hours')
  .select('*')
  .eq('company_id', companyId)
  .eq('day_of_week', dayOfWeek)
  .in('hour_type', ['regular', 'office']); // Only booking-relevant types

// Find any open hours (prefer 'office' for booking, then 'regular')
const hours = allHours?.find(h => !h.is_closed && h.hour_type === 'office') 
           || allHours?.find(h => !h.is_closed && h.hour_type === 'regular');

if (!hours) {
  return { success: true, available_slots: [], message: 'Business is closed on this day' };
}
```

---

## Why This Fix Works

| Before | After |
|--------|-------|
| Query returns error when 4 rows exist | Query returns all rows, then finds open one |
| `hours = null` → "Business closed" | `hours = office hours` → Proceeds to check slots |
| Timezone-sensitive date parsing | Local date component parsing |

---

## Deployment
After the change, the `booking-actions` edge function will be automatically redeployed.

