

## Fix: Outbound Call Returns Null SID

### Problem
SignalWire's LaML (Twilio-compatible) REST API requires a `.json` extension on the endpoint URL to return JSON responses. The current URL ends in `/Calls`, which causes SignalWire to return an empty 200 response instead of a JSON body containing the call SID.

### Solution
A one-line fix in `supabase/functions/outbound-call/index.ts`:

**Change line 178 from:**
```
const signalwireUrl = `https://${integration.signalwire_space_url}/api/laml/2010-04-01/Accounts/${integration.signalwire_project_id}/Calls`;
```

**To:**
```
const signalwireUrl = `https://${integration.signalwire_space_url}/api/laml/2010-04-01/Accounts/${integration.signalwire_project_id}/Calls.json`;
```

### What This Fixes
- SignalWire will now return a proper JSON body with `sid`, `status`, and other call metadata
- The `callSid` field in the response will be populated
- The `call_logs` table insert will correctly store the call SID for tracking

### Cleanup (Optional)
The empty-body fallback logic (lines 236-284) can remain as a safety net, but it should no longer be triggered after this fix.

### Technical Details
- **File**: `supabase/functions/outbound-call/index.ts`
- **Change**: Append `.json` to the SignalWire Calls API URL
- **Redeploy**: The `outbound-call` edge function will be redeployed automatically

