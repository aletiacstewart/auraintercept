## Review of Claude's recommendations

**Verdict: correct and safe to apply as written.** I verified:

- All 4 functions currently accept unauthenticated requests and can be abused to send email/SMS/voice on a tenant's provider account, or inject fake staff alerts.
- Every server-to-server caller (`send-campaign`, `booking-actions`, `verify-insurance`, `ai-agent-chat`, `customer-portal`, `missed-call-handler`) constructs its Supabase client with `SUPABASE_SERVICE_ROLE_KEY`, so `supabase.functions.invoke(...)` forwards a service-role JWT — which hits the `isService` fast path in `authorizeInternalRequest` and passes through untouched.
- Dashboard callers (`SMSChat.tsx`, `AppointmentCalendar.tsx`, `FieldOpsAgentConsole.tsx`, `TestCallDialog.tsx`, `OutboundCallDialog.tsx`) auto-attach the user JWT via `supabase.functions.invoke`, so the company-scope check runs against their real `company_id` with no client changes needed.
- The `priority: "critical"` bypass in `send-email-guarded` is a real second bug — client input directly overrides the volume cap. Gating it behind `authResult.ctx.isService` is the right fix.

The helper we're reusing is the same one that just closed the `agent-action-executor` hole, so the pattern is proven.

## Changes

### 1. `supabase/functions/send-email-guarded/index.ts`
- Import `authorizeInternalRequest`.
- Rename destructured `priority` → `priority: requestedPriority` (default `'normal'`).
- Make `companyId` **required** (400 if missing) — its only real caller (`send-campaign`) always provides it.
- Call `authorizeInternalRequest(req, companyId)`; return its `{status, error}` on failure.
- Compute effective `priority = authResult.ctx.isService ? requestedPriority : 'normal'` so only genuine service callers can request the cap-bypassing critical priority.
- Pass `priority` (not `requestedPriority`) into `sendGuardedEmail`.

### 2. `supabase/functions/send-appointment-sms/index.ts`
- Import `authorizeInternalRequest`.
- After the existing `companyId` / `customerPhone` / `rawMessage` validation, call `authorizeInternalRequest(req, companyId)` and return its error response on failure. Everything downstream (opt-out check, industry pack, `sendGuardedSms`) stays unchanged.

### 3. `supabase/functions/outbound-call/index.ts`
- Import `authorizeInternalRequest`.
- After payload parse + `companyId` / phone validation, call `authorizeInternalRequest(req, companyId)` and return its error response on failure. Downstream call-placement logic unchanged.

### 4. `supabase/functions/send-staff-notification/index.ts`
- Import `authorizeInternalRequest`.
- After parsing the request body, call `authorizeInternalRequest(req, companyId)` and return its error response on failure. Existing in-app / email / SMS / push dispatch unchanged.

### No frontend changes
All dashboard callers already invoke via `supabase.functions.invoke(...)`, which attaches the user JWT automatically.

### No config changes
All four functions already deploy with `verify_jwt = false` (required so we can hand-authorize and accept the service-role bearer fast path). Leave `supabase/config.toml` alone.

## Acceptance

- Unauthenticated `curl` to any of the 4 functions → `401`.
- `curl` with the public anon key alone → `401`/`403` (anon key holds no `sub`/company).
- Cross-tenant call (Company A user targeting Company B's `companyId`) → `403`, no side effects.
- Same-company dashboard flows (`SMSChat`, `AppointmentCalendar`, `FieldOpsAgentConsole`, `TestCallDialog`, `OutboundCallDialog`) work unchanged.
- `send-campaign` → `send-email-guarded` and `send-campaign` → `send-appointment-sms` still succeed (service-role fast path).
- `booking-actions` and `verify-insurance` → `send-staff-notification` still succeed.
- Non-service caller passing `"priority":"critical"` is silently downgraded to `"normal"` and hits the daily/monthly cap normally.
