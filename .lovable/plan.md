
# Add Domain Verification Functionality

## Summary
The custom domain verification is stuck on "Verification Pending" because there's no mechanism to check DNS records. This plan adds a "Check Verification" button and an edge function to verify DNS records.

---

## Current State
- User can enter a custom domain (`smart.auraintercept.ai`)
- DNS instructions are displayed (CNAME + TXT records)
- `domain_verified` flag exists but is never updated
- No verification trigger exists

## Proposed Solution

### 1. Create Edge Function: `verify-domain`

**File:** `supabase/functions/verify-domain/index.ts`

The function will:
- Accept a `websiteId` parameter
- Fetch the website's `custom_domain` and `dns_verification_code`
- Perform DNS lookups to verify:
  - **CNAME record**: Domain points to `site.auraintercept.app`
  - **TXT record**: `_aura-verify.[domain]` contains the verification code
- Update `domain_verified` to `true` if both records are correct
- Return verification status with detailed feedback

```typescript
// DNS lookup using Deno's built-in DNS resolver
const txtRecords = await Deno.resolveDns(`_aura-verify.${domain}`, "TXT");
const cnameRecords = await Deno.resolveDns(domain, "CNAME");

// Check TXT record contains verification code
// Check CNAME points to site.auraintercept.app
```

---

### 2. Update SmartWebsiteManager.tsx

**File:** `src/pages/SmartWebsiteManager.tsx`

**A. Add verification mutation (after line ~200):**
```typescript
const verifyDomain = useMutation({
  mutationFn: async () => {
    const { data, error } = await supabase.functions.invoke('verify-domain', {
      body: { websiteId: website.id }
    });
    if (error) throw error;
    return data;
  },
  onSuccess: (data) => {
    if (data.verified) {
      toast.success('Domain verified successfully!');
      queryClient.invalidateQueries({ queryKey: ['smart-website'] });
    } else {
      toast.error(data.message || 'DNS records not found yet');
    }
  },
  onError: () => {
    toast.error('Failed to verify domain');
  }
});
```

**B. Add "Check Verification" button (after line ~996):**
```tsx
{!website.domain_verified && (
  <div className="text-sm space-y-2">
    <p>Add the following DNS records to your domain:</p>
    {/* DNS record instructions... */}
    
    <Button
      onClick={() => verifyDomain.mutate()}
      disabled={verifyDomain.isPending}
      className="mt-4"
    >
      {verifyDomain.isPending ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Checking...
        </>
      ) : (
        <>
          <RefreshCw className="w-4 h-4 mr-2" />
          Check Verification
        </>
      )}
    </Button>
    
    <p className="text-muted-foreground text-xs mt-2">
      DNS changes typically take 15 minutes to 48 hours to propagate.
    </p>
  </div>
)}
```

---

### 3. Edge Function Implementation Details

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const { websiteId } = await req.json();
  
  // 1. Fetch website data
  const { data: website } = await supabase
    .from('smart_websites')
    .select('custom_domain, dns_verification_code')
    .eq('id', websiteId)
    .single();
  
  // 2. Verify CNAME record
  let cnameValid = false;
  try {
    const cname = await Deno.resolveDns(website.custom_domain, "CNAME");
    cnameValid = cname.some(r => r.includes('site.auraintercept.app'));
  } catch { /* Not found */ }
  
  // 3. Verify TXT record
  let txtValid = false;
  try {
    const txt = await Deno.resolveDns(`_aura-verify.${website.custom_domain}`, "TXT");
    txtValid = txt.flat().some(r => r.includes(website.dns_verification_code));
  } catch { /* Not found */ }
  
  // 4. Update database if both valid
  if (cnameValid && txtValid) {
    await supabase
      .from('smart_websites')
      .update({ domain_verified: true })
      .eq('id', websiteId);
    
    return Response.json({ verified: true });
  }
  
  return Response.json({
    verified: false,
    cnameValid,
    txtValid,
    message: !cnameValid && !txtValid 
      ? 'No DNS records found yet. Please wait for propagation.'
      : !cnameValid 
        ? 'CNAME record not found or incorrect'
        : 'TXT verification record not found'
  });
});
```

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/functions/verify-domain/index.ts` | Create new edge function |
| `src/pages/SmartWebsiteManager.tsx` | Add verify button and mutation |

---

## User Experience

1. User enters custom domain → sees "Verification Pending"
2. User adds DNS records at their registrar
3. User clicks **"Check Verification"** button
4. System checks DNS and provides feedback:
   - ✅ Both records valid → "Domain verified successfully!"
   - ⚠️ Partial → Shows which record is missing
   - ❌ None found → "DNS records not found yet. Please wait for propagation."
5. On success, status changes to "Domain Verified" with green checkmark
