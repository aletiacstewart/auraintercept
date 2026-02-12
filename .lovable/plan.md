

## Fix: ElevenLabs Voice Not Working for Customer Portal Users

### Root Cause

The `tenant_integrations` table has RLS policies that only allow `company_admin` and `platform_admin` roles to read. When a customer logs in and selects Aura Intercept on the customer portal, the `VoiceChat` component queries `tenant_integrations` for the `elevenlabs_agent_id` -- but RLS blocks the read, returning `null`. This triggers the browser voice fallback.

### Solution

Add a new RLS policy on `tenant_integrations` that allows authenticated users with the `customer` role to **read only** the `elevenlabs_agent_id` column for their associated company. Since RLS operates at the row level (not column level), the safest approach is to create a secure database function that customers can call to fetch just the agent ID.

### Implementation

**1. Create a secure RPC function: `get_elevenlabs_agent_id`**

A new database function that accepts a `company_id` parameter and returns the `elevenlabs_agent_id`. This avoids exposing the full `tenant_integrations` row (which may contain API keys and other secrets) to customers.

```sql
CREATE OR REPLACE FUNCTION public.get_elevenlabs_agent_id(p_company_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT elevenlabs_agent_id
  FROM public.tenant_integrations
  WHERE company_id = p_company_id
  LIMIT 1;
$$;
```

Using `SECURITY DEFINER` bypasses RLS safely while exposing only the agent ID (which is a public-facing identifier anyway, since it's used client-side in the ElevenLabs SDK).

**2. Update `VoiceChat.tsx` (~line 144-152)**

Replace the direct `supabase.from('tenant_integrations').select(...)` query with a call to the new RPC function:

```typescript
// Before
const { data } = await supabase
  .from("tenant_integrations")
  .select("elevenlabs_agent_id")
  .eq("company_id", companyId)
  .maybeSingle();
if (data?.elevenlabs_agent_id) setAgentId(data.elevenlabs_agent_id);

// After
const { data } = await supabase.rpc("get_elevenlabs_agent_id", {
  p_company_id: companyId,
});
if (data) setAgentId(data);
```

This ensures all authenticated users (including customers) can retrieve the ElevenLabs agent ID without exposing other integration secrets.

### Why Not Just Add an RLS Policy?

The `tenant_integrations` table likely contains sensitive fields (API keys, webhook secrets, etc.). Adding a broad `SELECT` policy for customers would expose all columns. The RPC approach with `SECURITY DEFINER` is the most secure option -- it returns only the agent ID.

