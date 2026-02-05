

# Fix Edge Function Deployment Issues

## Problem Identified

The live preview is loading correctly, but the `check-subscription` edge function is returning a 404 error because it's not deployed. The function uses `esm.sh` imports which can cause unstable bundle generation and deployment timeouts.

## Root Cause

The `check-subscription` edge function uses:
```typescript
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
```

According to the project's architecture standards, edge functions should use `npm:` specifiers for better stability.

## Solution

### Phase 1: Update check-subscription Edge Function

Update the imports in `supabase/functions/check-subscription/index.ts`:

**Before:**
```typescript
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
```

**After:**
```typescript
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "npm:stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2";
```

### Phase 2: Deploy Edge Function

After updating the imports, deploy the `check-subscription` function:

```
Deploy: check-subscription
```

### Phase 3: Verify Deployment

Test the edge function to confirm it's working:
- Call the function endpoint
- Check the logs for successful execution

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/check-subscription/index.ts` | Update imports from `esm.sh` to `npm:` specifier |

## Expected Outcome

- The `check-subscription` edge function will deploy successfully
- Subscription status checks will work correctly in the dashboard
- No more 404 errors for the function endpoint

