
# Fix Voice/SMS SignalWire Conflicts

## Problem Summary

Your system stores phone numbers in human-readable format (`+1 (484) 737-2424`) but SignalWire requires E.164 format (`+14847372424`) for all API calls. This mismatch causes:
- Outbound calls to fail silently (status 200, empty body)
- Inbound SMS to not be routed to your company
- Missed calls to not be tracked

---

## Solution: Normalize Phone Numbers System-Wide

### Step 1: Create Shared Phone Normalization Utility

Create a shared utility file that all edge functions can import:

```
supabase/functions/_shared/phone-utils.ts
```

This will contain the `normalizePhoneNumber()` function that converts any phone format to E.164.

---

### Step 2: Fix `outbound-call/index.ts`

**Current:** Line 181 uses `integration.signalwire_phone_number` directly
**Fix:** Normalize the `From` number before sending to SignalWire

```
formData.append('From', normalizePhoneNumber(integration.signalwire_phone_number));
```

---

### Step 3: Fix `sms-handler/index.ts`

**Current:** Line 67 uses exact match
**Fix:** Normalize incoming `toNumber` and use same approach as `voice-handler`

- Fetch all integrations with non-null phone numbers
- Filter client-side using normalized comparison
- This matches the pattern already working in `voice-handler`

---

### Step 4: Fix `missed-call-handler/index.ts`

**Current:** Line 38 uses exact match
**Fix:** Same approach - fetch all integrations and filter with normalization

---

### Step 5: Fix `send-appointment-sms/index.ts`

**Current:** Line 68 uses `integrations.signalwire_phone_number` directly
**Fix:** Normalize before sending

---

### Step 6: Fix `test-voice-reminder/index.ts`

**Current:** Line 98 uses `integration.signalwire_phone_number` directly
**Fix:** Normalize before sending

---

### Step 7: Standardize Import Patterns

Update all functions to use `Deno.serve()` and `npm:` specifiers:

| File | Change |
|------|--------|
| `voice-handler/index.ts` | Replace `serve` import with `Deno.serve()` |
| `sms-handler/index.ts` | Replace `serve` import with `Deno.serve()` |
| `missed-call-handler/index.ts` | Replace `serve` import with `Deno.serve()` |

---

## Technical Details

### Phone Normalization Logic

```typescript
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  // Remove all non-digit characters except leading +
  let normalized = phone.replace(/[^\d+]/g, '');
  // Ensure E.164 format
  if (!normalized.startsWith('+') && normalized.length === 11 && normalized.startsWith('1')) {
    normalized = '+' + normalized;
  } else if (!normalized.startsWith('+') && normalized.length === 10) {
    normalized = '+1' + normalized;
  }
  return normalized;
}
```

### Files to Modify

1. **Create:** `supabase/functions/_shared/phone-utils.ts`
2. **Edit:** `supabase/functions/outbound-call/index.ts`
3. **Edit:** `supabase/functions/sms-handler/index.ts`
4. **Edit:** `supabase/functions/missed-call-handler/index.ts`
5. **Edit:** `supabase/functions/send-appointment-sms/index.ts`
6. **Edit:** `supabase/functions/test-voice-reminder/index.ts`
7. **Edit:** `supabase/functions/voice-handler/index.ts` (standardize imports only)

---

## Expected Outcome

After these fixes:
- ✅ Outbound calls will use properly formatted `From` numbers
- ✅ Inbound SMS will match your company correctly
- ✅ Missed calls will be tracked and callbacks initiated
- ✅ All functions will deploy reliably with modern imports
- ✅ Your ElevenLabs voice will work instead of default Polly.Joanna

---

## Optional Future Improvement

Consider normalizing phone numbers when **saving** to the database (in the frontend `SMSIntegration.tsx` component). This would:
- Ensure consistent E.164 format at the source
- Simplify edge function logic
- Prevent future format mismatches
