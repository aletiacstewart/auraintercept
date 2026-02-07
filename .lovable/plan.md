
# Edge Function Migration: Twilio → SignalWire

## Overview
Update all 12 edge functions to use SignalWire credentials and API endpoints instead of Twilio.

---

## Changes Per Edge Function

### 1. `sms-handler/index.ts`
**Database Query (Lines 63-68):**
```typescript
// Before: twilio_account_sid, twilio_auth_token, twilio_phone_number
// After: signalwire_project_id, signalwire_api_token, signalwire_phone_number, signalwire_space_url
.eq('signalwire_phone_number', toNumber)
```

**sendSmsReply Function (Lines 299-333):**
- Change function signature to accept SignalWire fields
- Update API URL: `https://${spaceUrl}/api/laml/2010-04-01/Accounts/${projectId}/Messages`
- Update authentication to use `projectId:apiToken`

---

### 2. `voice-handler/index.ts`
**Incoming Call Handler (Lines 65-70):**
```typescript
.eq('signalwire_phone_number', calledPhone)
```

**Note:** SignalWire uses cXML which is compatible with TwiML, so response formats remain unchanged.

---

### 3. `missed-call-handler/index.ts`
**Database Query (Lines 35-39):**
```typescript
.select('company_id, signalwire_project_id, signalwire_api_token, signalwire_phone_number, signalwire_space_url, elevenlabs_api_key, elevenlabs_voice_id')
.eq('signalwire_phone_number', calledNumber)
```

**sendFollowUpSMS Function (Lines 284-317):**
- Update to use `signalwireUrl` pattern
- Change auth from `accountSid:authToken` to `projectId:apiToken`

---

### 4. `send-appointment-sms/index.ts`
**Database Query (Lines 41-44):**
```typescript
.select('signalwire_project_id, signalwire_api_token, signalwire_phone_number, signalwire_space_url')
```

**Validation (Lines 55-59):**
```typescript
if (!integrations?.signalwire_project_id || !integrations?.signalwire_api_token || !integrations?.signalwire_phone_number || !integrations?.signalwire_space_url) {
  return { error: 'SignalWire not configured for this company' }
}
```

**API Call (Lines 63, 206):**
```typescript
const signalwireUrl = `https://${integrations.signalwire_space_url}/api/laml/2010-04-01/Accounts/${integrations.signalwire_project_id}/Messages`;
```

---

### 5. `send-review-request/index.ts`
**Database Query (Line 116-117):**
```typescript
.select('signalwire_project_id, signalwire_api_token, signalwire_phone_number, signalwire_space_url, resend_api_key')
```

**SMS Send (Lines 211, 216-217):**
```typescript
if (integrations?.signalwire_project_id && integrations?.signalwire_api_token && integrations?.signalwire_phone_number && integrations?.signalwire_space_url) {
  const signalwireUrl = `https://${integrations.signalwire_space_url}/api/laml/2010-04-01/Accounts/${integrations.signalwire_project_id}/Messages`;
  const credentials = btoa(`${integrations.signalwire_project_id}:${integrations.signalwire_api_token}`);
```

---

### 6. `lead-follow-up-reminders/index.ts`
**Database Query (Lines 100-104):**
```typescript
.select('signalwire_project_id, signalwire_api_token, signalwire_phone_number, signalwire_space_url')
```

**Validation & API Call (Lines 106, 111-112):**
```typescript
if (settings?.signalwire_project_id && settings?.signalwire_api_token && settings?.signalwire_phone_number && settings?.signalwire_space_url) {
  const signalwireResponse = await fetch(
    `https://${settings.signalwire_space_url}/api/laml/2010-04-01/Accounts/${settings.signalwire_project_id}/Messages`,
    {
      headers: {
        'Authorization': `Basic ${btoa(`${settings.signalwire_project_id}:${settings.signalwire_api_token}`)}`,
```

---

### 7. `outbound-call/index.ts`
**Database Query (Lines 81-84):**
```typescript
.select('signalwire_project_id, signalwire_api_token, signalwire_phone_number, signalwire_space_url, elevenlabs_api_key, elevenlabs_voice_id')
```

**Validation (Lines 87-92):**
```typescript
if (integrationError || !integration?.signalwire_project_id) {
  return { error: 'SignalWire integration not configured' }
}
```

**API URL (Line 132):**
```typescript
const signalwireUrl = `https://${integration.signalwire_space_url}/api/laml/2010-04-01/Accounts/${integration.signalwire_project_id}/Calls`;
```

---

### 8. `test-voice-reminder/index.ts`
**Database Query (Lines 56-60):**
```typescript
.select('signalwire_project_id, signalwire_api_token, signalwire_phone_number, signalwire_space_url, elevenlabs_api_key, elevenlabs_voice_id')
```

**Validation (Lines 70-75):**
```typescript
if (!integration?.signalwire_project_id || !integration?.signalwire_api_token || !integration?.signalwire_phone_number || !integration?.signalwire_space_url) {
  return { error: 'SignalWire integration not configured' }
}
```

**API URL (Line 85):**
```typescript
const signalwireUrl = `https://${integration.signalwire_space_url}/api/laml/2010-04-01/Accounts/${integration.signalwire_project_id}/Calls`;
```

---

### 9. `send-job-notification/index.ts`
**Database Query (Lines 92-95):**
```typescript
.select('signalwire_project_id, signalwire_api_token, signalwire_phone_number, signalwire_space_url, resend_api_key')
```

**Validation & API Call (Lines 117, 127-128):**
```typescript
if (integrations?.signalwire_project_id && integrations?.signalwire_api_token && integrations?.signalwire_phone_number && integrations?.signalwire_space_url) {
  const signalwireUrl = `https://${integrations.signalwire_space_url}/api/laml/2010-04-01/Accounts/${integrations.signalwire_project_id}/Messages`;
  const credentials = btoa(`${integrations.signalwire_project_id}:${integrations.signalwire_api_token}`);
```

---

### 10. `send-staff-notification/index.ts`
**Database Query (Lines 205-209):**
```typescript
const { data: integration } = await supabase
  .from('tenant_integrations')  // Changed from 'twilio_integrations'
  .select('signalwire_project_id, signalwire_api_token, signalwire_phone_number, signalwire_space_url')
  .eq('company_id', companyId)
  .single();
```

**API Call (Lines 211-220):**
```typescript
if (integration?.signalwire_project_id && integration?.signalwire_api_token && integration?.signalwire_phone_number && integration?.signalwire_space_url) {
  const signalwireUrl = `https://${integration.signalwire_space_url}/api/laml/2010-04-01/Accounts/${integration.signalwire_project_id}/Messages`;
  await fetch(signalwireUrl, {
    headers: {
      'Authorization': 'Basic ' + btoa(`${integration.signalwire_project_id}:${integration.signalwire_api_token}`),
```

---

### 11. `appointment-reminders/index.ts`
**Interface Update (Lines 23-30):**
```typescript
interface CompanyIntegration {
  company_id: string;
  signalwire_project_id: string | null;
  signalwire_api_token: string | null;
  signalwire_phone_number: string | null;
  signalwire_space_url: string | null;
  resend_api_key: string | null;
  elevenlabs_api_key: string | null;
  elevenlabs_voice_id: string | null;
  company: { name: string; };
}
```

**Database Query (Lines 132-135):**
```typescript
.select('company_id, signalwire_project_id, signalwire_api_token, signalwire_phone_number, signalwire_space_url, resend_api_key, elevenlabs_api_key, elevenlabs_voice_id, company:companies(name)')
```

**Validation (Line 157):**
```typescript
const hasSignalWire = integration?.signalwire_project_id && integration?.signalwire_api_token && integration?.signalwire_phone_number && integration?.signalwire_space_url;
```

**API Calls (Lines 238-239, 325-326):**
```typescript
const signalwireUrl = `https://${integration!.signalwire_space_url}/api/laml/2010-04-01/Accounts/${integration!.signalwire_project_id}/Messages`;
const authHeader = btoa(`${integration!.signalwire_project_id}:${integration!.signalwire_api_token}`);
```

---

## API URL Pattern Change Summary

| Component | Twilio | SignalWire |
|-----------|--------|------------|
| SMS URL | `api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json` | `{space}.signalwire.com/api/laml/2010-04-01/Accounts/{project}/Messages` |
| Call URL | `api.twilio.com/2010-04-01/Accounts/{sid}/Calls.json` | `{space}.signalwire.com/api/laml/2010-04-01/Accounts/{project}/Calls` |
| Auth | `account_sid:auth_token` | `project_id:api_token` |

---

## Files to Update
1. `supabase/functions/sms-handler/index.ts`
2. `supabase/functions/voice-handler/index.ts`
3. `supabase/functions/missed-call-handler/index.ts`
4. `supabase/functions/send-appointment-sms/index.ts`
5. `supabase/functions/send-review-request/index.ts`
6. `supabase/functions/lead-follow-up-reminders/index.ts`
7. `supabase/functions/outbound-call/index.ts`
8. `supabase/functions/test-voice-reminder/index.ts`
9. `supabase/functions/send-job-notification/index.ts`
10. `supabase/functions/send-staff-notification/index.ts`
11. `supabase/functions/appointment-reminders/index.ts`

---

## Deployment Note
After updating all edge functions, they will be automatically deployed. The SignalWire webhook URLs should be configured in the SignalWire dashboard to point to the same edge function endpoints (they remain unchanged).
