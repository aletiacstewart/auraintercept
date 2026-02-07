
# Twilio to SignalWire Migration Plan

## Overview
Replace all Twilio references with SignalWire across the entire platform, including frontend UI, documentation, edge functions, and database schema.

## Scope Analysis

### Files Requiring Updates

**Frontend/UI Components (9 files)**
| File | Changes Needed |
|------|----------------|
| `src/pages/Auth.tsx` | Update 3rd party integration cards (Twilio → SignalWire, update pricing) |
| `src/pages/Index.tsx` | Update homepage integration cards and pricing |
| `src/pages/Subscription.tsx` | Update feature descriptions and tier comparison |
| `src/pages/AIAgent.tsx` | Update voice integration status checks and links |
| `src/pages/integrations/SMSIntegration.tsx` | Replace Twilio integration with SignalWire |
| `src/components/integrations/TwilioSetupGuide.tsx` | Rename to `SignalWireSetupGuide.tsx`, rewrite entire guide |
| `src/components/landing/PricingComparisonTable.tsx` | Update tooltips and descriptions |
| `src/lib/documentationConfig.ts` | Update THIRD_PARTY_INTEGRATIONS and INTEGRATION_REQUIREMENTS |
| `src/pages/PrivacyPolicy.tsx` | Update third-party service provider mention |

**Edge Functions (12+ files)**
| Function | Changes Needed |
|----------|----------------|
| `sms-handler` | Update API URL, field references (twilio_* → signalwire_*) |
| `voice-handler` | Update API URL, TwiML → cXML (compatible) |
| `missed-call-handler` | Update API calls and field references |
| `send-appointment-sms` | Update API calls and field references |
| `send-review-request` | Update SMS sending logic |
| `lead-follow-up-reminders` | Update credentials lookup |
| `voice-booking-agent` | Update SMS sending |
| `outbound-call` | Update voice call initiation |
| `test-voice-reminder` | Update test endpoint |
| `send-job-notification` | Update SMS notifications |
| `send-staff-notification` | Update staff SMS |
| `appointment-reminders` | Update reminder logic |

**Database Schema Changes**
| Current Field | New Field |
|---------------|-----------|
| `twilio_account_sid` | `signalwire_project_id` |
| `twilio_auth_token` | `signalwire_api_token` |
| `twilio_phone_number` | `signalwire_phone_number` |
| Add new field | `signalwire_space_url` |

---

## Implementation Details

### 1. Database Migration
Create new columns in `tenant_integrations` table:
- `signalwire_project_id` (TEXT)
- `signalwire_api_token` (TEXT)
- `signalwire_phone_number` (TEXT)
- `signalwire_space_url` (TEXT)

Note: Keep Twilio columns temporarily for backward compatibility, then deprecate.

### 2. SignalWire API Compatibility
SignalWire offers a Twilio-compatible REST API, making migration simpler:

**Twilio URL Pattern:**
```
https://api.twilio.com/2010-04-01/Accounts/{ACCOUNT_SID}/Messages.json
```

**SignalWire URL Pattern:**
```
https://{SPACE_URL}/api/laml/2010-04-01/Accounts/{PROJECT_ID}/Messages
```

Authentication remains HTTP Basic with PROJECT_ID:API_TOKEN.

### 3. Pricing Updates (SignalWire vs Twilio)

| Feature | Twilio | SignalWire |
|---------|--------|------------|
| Phone Number | $1.15/mo | $2.00/mo |
| Outbound SMS | $0.0079/msg | $0.004/msg (40% cheaper) |
| Inbound SMS | $0.0075/msg | $0.004/msg |
| Outbound Voice | $0.014/min | $0.01/min |
| Inbound Voice | $0.0085/min | $0.01/min |

### 4. A2P 10DLC Compliance
SignalWire handles 10DLC registration similarly to Twilio. Update the setup guide to reference:
- SignalWire Brand Registration
- Campaign Registration within SignalWire dashboard
- Number-to-Campaign linking

### 5. UI Changes

**Integration Cards (Auth.tsx & Index.tsx):**
```
Before:
- Name: "Twilio"
- Pricing: "$1.15/number • $0.0079/SMS"

After:
- Name: "SignalWire"
- Pricing: "$2/number • $0.004/SMS (40% cheaper)"
```

**Setup Guide:**
Rename `TwilioSetupGuide.tsx` → `SignalWireSetupGuide.tsx` with:
- New account creation link: signalwire.com
- SignalWire Space URL configuration
- Project ID and API Token retrieval
- Updated webhook URLs
- Updated 10DLC registration steps

### 6. Edge Function Updates

Each edge function using Twilio will need:

1. **Field name updates:**
   ```typescript
   // Before
   .select('twilio_account_sid, twilio_auth_token, twilio_phone_number')
   
   // After  
   .select('signalwire_project_id, signalwire_api_token, signalwire_phone_number, signalwire_space_url')
   ```

2. **API URL updates:**
   ```typescript
   // Before
   const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilio_account_sid}/Messages.json`;
   
   // After
   const signalwireUrl = `https://${signalwire_space_url}/api/laml/2010-04-01/Accounts/${signalwire_project_id}/Messages`;
   ```

3. **Response format:** SignalWire uses cXML (compatible with TwiML), minimal changes needed.

---

## Implementation Order

1. **Phase 1: Database** - Add new SignalWire columns to tenant_integrations
2. **Phase 2: Documentation Config** - Update `documentationConfig.ts` central source
3. **Phase 3: Setup Guide** - Create `SignalWireSetupGuide.tsx` component
4. **Phase 4: Integration Pages** - Update SMSIntegration.tsx and AIAgent.tsx
5. **Phase 5: Landing Pages** - Update Auth.tsx and Index.tsx integration cards
6. **Phase 6: Edge Functions** - Update all 12+ functions with new API calls
7. **Phase 7: Cleanup** - Update remaining references (PrivacyPolicy, Subscription, etc.)

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/integrations/SignalWireSetupGuide.tsx` | New setup guide component |

## Files to Delete

| File | Reason |
|------|--------|
| `src/components/integrations/TwilioSetupGuide.tsx` | Replaced by SignalWire version |

---

## Testing Checklist

- Verify SignalWire credentials can be saved to database
- Test SMS sending via SignalWire API
- Test inbound SMS webhook handling
- Test voice call initiation
- Test inbound voice call handling
- Verify 10DLC registration flow documentation
- Confirm all UI references updated (no "Twilio" mentions remain)
