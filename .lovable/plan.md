

# Fix Phone Number Format Matching for ElevenLabs Voice

## Problem Identified

SignalWire phone calls are using a default robotic voice (Polly.Joanna) instead of your configured ElevenLabs voice because:

**Phone number format mismatch prevents credential lookup:**
- Database stores: `+1 (484) 737-2424` (human-readable format)
- SignalWire sends: `+14847372424` (E.164 format - digits only)

The `voice-handler` cannot find your company's ElevenLabs API key because the phone numbers don't match exactly.

## Solution

Normalize phone numbers to E.164 format before comparing. This will fix the lookup query so your ElevenLabs credentials are found.

### Implementation Steps

#### Step 1: Add Phone Number Normalization Function
Add a utility function in `voice-handler` that strips all non-digit characters (except leading `+`):

```text
Input: "+1 (484) 737-2424" → Output: "+14847372424"
Input: "1-484-737-2424"   → Output: "+14847372424"
Input: "+14847372424"     → Output: "+14847372424"
```

#### Step 2: Update the Database Query
Instead of exact string matching, normalize both the incoming number and database values for comparison. The query will:
1. Take the incoming `calledPhone` from SignalWire
2. Normalize it to E.164 format
3. Search for matching normalized phone numbers in the database

#### Step 3: Apply to All Phone Lookups
Update both the incoming call handler and any other places that look up by phone number.

## Technical Details

**File: `supabase/functions/voice-handler/index.ts`**

New helper function:
```typescript
function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  // Remove all non-digit characters except leading +
  let normalized = phone.replace(/[^\d+]/g, '');
  // Ensure E.164 format (add + if missing for US numbers)
  if (!normalized.startsWith('+') && normalized.length === 11 && normalized.startsWith('1')) {
    normalized = '+' + normalized;
  } else if (!normalized.startsWith('+') && normalized.length === 10) {
    normalized = '+1' + normalized;
  }
  return normalized;
}
```

Updated query approach: Since Supabase doesn't support SQL functions in equality checks directly, the solution will fetch candidate integrations and filter client-side, OR update the database to store numbers in E.164 format.

**Recommended approach: Store E.164 format in database**
- Update the save mutation in `SMSIntegration.tsx` to normalize phone numbers before saving
- This ensures consistent format going forward
- One-time migration to fix existing data

## Expected Outcome
After this fix:
- Incoming calls will successfully match your phone number
- ElevenLabs API credentials will be retrieved
- Your configured Jessica voice (ID: `cgSgspJ2msm6clMCkdW9`) will be used
- No more default robotic voice fallback

