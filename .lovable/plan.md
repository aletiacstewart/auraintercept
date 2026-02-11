
## Update 3rd Party Integration Requirements for All-Tier Voice, SMS & Email

### Current State vs. Required Changes

With all tiers now having voice, SMS/text, and email capabilities (previously Business tier was "digital-only"), the integration requirements need to be updated to reflect accurate mandatory integrations across all tiers.

### What Needs to Change

#### 1. **Source of Truth: `src/lib/documentationConfig.ts`**

**THIRD_PARTY_INTEGRATIONS array (lines 588-631):**
- Update `SignalWire` `requiredFor` from "Halo+ (for Voice)" to "All Tiers (All plans now have Voice & SMS)"
- Update `ElevenLabs` `requiredFor` from "Halo+ (for Voice)" to "All Tiers (All plans now have Voice)"
- Update `Resend` `requiredFor` to explicitly state "All Tiers (All plans have Email)"
- Update `Google Calendar` `requiredFor` from "Optional for Halo+" to "Scheduling+ (required for booking/scheduling agents)"
- Update `Stripe` `requiredFor` from "All Tiers" to "Field Ops+ (required for invoicing)" -- Starter/Scheduling/Growth have optional payments
- Add new entry for **A2P 10DLC Compliance** as a required component for SMS (all tiers with SignalWire)

**INTEGRATION_REQUIREMENTS object (lines 751-817):**

Update each tier's integration requirements:
- **express (Starter)**: 
  - `resend`: Change from `required: false` to `required: true` (all tiers now get email)
  - `signalwire`: Update reason to "Required for Talk to Aura voice calls and SMS reminders"
  - Add `a2p_10dlc`: New field `{ required: true, reason: 'Required for US SMS compliance' }`
  
- **aura_flow (Scheduling)**: 
  - Already has correct requirements (signalwire, elevenlabs, resend all required)
  - Add `a2p_10dlc`: `{ required: true, reason: 'Required for US SMS compliance' }`
  
- **halo (Growth)**: 
  - `resend`: Change from `required: false` to `required: true` (all tiers now get email)
  - Add `a2p_10dlc`: `{ required: true, reason: 'Required for US SMS compliance' }`
  
- **core (Business)**: 
  - `signalwire`: Change from `required: false` to `required: true` (Business now has voice)
  - `elevenlabs`: Change from `required: false` to `required: true` (Business now has voice)
  - `resend`: Change from `required: false` to `required: true` (all tiers have email)
  - Add `a2p_10dlc`: `{ required: true, reason: 'Required for US SMS compliance' }`
  
- **single_point (Field Ops)**: 
  - Add `a2p_10dlc`: `{ required: true, reason: 'Required for US SMS compliance' }`
  
- **multi_track (Performance)**: 
  - Add `a2p_10dlc`: `{ required: true, reason: 'Required for US SMS compliance' }`
  
- **command (Command)**: 
  - Add `a2p_10dlc`: `{ required: true, reason: 'Required for US SMS compliance' }`

#### 2. **Update Feature Comparison Tables**

**`src/pages/Subscription.tsx` (lines 303-312):**
- Current "Required 3rd Party Integrations" section correctly shows SignalWire, ElevenLabs, Resend, and Stripe as appropriate
- Add new row: `{ name: 'A2P 10DLC Compliance', starter: 'Required', scheduling: 'Required', growth: 'Required', business: 'Required', fieldOps: 'Required', performance: 'Required', command: 'Required' }`
- Update Stripe row: Change from all tiers showing values to only Field Ops+ showing 'Required', others showing 'Optional'
- Update Calendar Sync row: Change from tier-based to 'Required' for Scheduling+ only

**`src/components/landing/PricingComparisonTable.tsx` (lines 180-193):**
- Mirror the same changes as above
- Add A2P 10DLC Compliance row with all 'Required'
- Update integration requirement patterns to match source of truth

#### 3. **Key Changes Summary**

| Integration | Change | Reason |
|---|---|---|
| **SignalWire** | All tiers → Required | All tiers now have Voice & SMS |
| **ElevenLabs** | Starter/Growth/Business → Required | Voice now universal |
| **Resend** | Starter/Growth/Business → Required | Email now universal |
| **A2P 10DLC** | New row, all tiers → Required | US SMS regulatory compliance with SignalWire |
| **Stripe** | Only Field Ops+ → Required | Invoicing tier feature |
| **Calendar Sync** | Only Scheduling+ → Required | Appointment/scheduling feature |

### Implementation Steps

1. Update `THIRD_PARTY_INTEGRATIONS` array with corrected "requiredFor" values
2. Add `a2p_10dlc` to `IntegrationId` union type
3. Update all 7 tier entries in `INTEGRATION_REQUIREMENTS` with new requirements
4. Update `INTEGRATION_REQUIREMENTS.free` fallback entry
5. Update feature table rows in `Subscription.tsx` 
6. Update feature table rows in `PricingComparisonTable.tsx`
7. Verify that no hardcoded integration rows elsewhere need updates (PDFs, help content)

### Technical Notes

- A2P 10DLC is a **US SMS regulatory requirement** for sending SMS via SignalWire to US phone numbers. It must be configured with SignalWire to enable SMS capabilities.
- The integration requirements configuration is the single source of truth for UI displays, settings pages, and integration setup flows.
- Any references to old integration patterns (like "text-only" for Business) should be removed since Business now has full communication channels.
