

# Add A2P 10DLC Compliance Grid Box

## Overview
Add a dedicated grid box for A2P 10DLC (Application-to-Person 10-Digit Long Code) compliance requirements with Twilio SMS to the "3rd Party Integration Costs + Usage Fees" section on the homepage.

## Change Details

### File: `src/pages/Index.tsx`

**Add after the Twilio card** (after line 1119):

```typescript
<div className="rounded-lg p-4 dark-card-surface" style={{ backgroundColor: '#2a3d4e' }}>
  <div className="flex items-center gap-2 mb-2">
    <Shield className="w-4 h-4 text-cyan-400" />
    <span className="font-semibold text-sm text-white">A2P 10DLC Compliance</span>
  </div>
  <p className="text-xs text-white/70 mb-2">US SMS Carrier Registration (Twilio)</p>
  <p className="text-xs text-white/90 font-medium">One-time: $4 Brand + $15 Campaign</p>
  <p className="text-xs text-white/70">Monthly: $10/campaign • Surcharge: ~$0.003/SMS</p>
  <p className="text-xs text-white/60 mt-1">Required for: All SMS features • Prevents carrier filtering</p>
</div>
```

**Add Import**: Add `Shield` to the lucide-react import statement (if not already present)

## Technical Details

### A2P 10DLC Information Included:
- **Brand Registration**: One-time $4 fee (Business EIN/Address required)
- **Campaign Registration**: One-time $15 + $10/month fee
- **Carrier Surcharges**: ~$0.003 per SMS segment
- **Purpose**: Mandatory for reliable US SMS delivery to prevent carrier filtering

### Visual Placement
The new card will appear directly after the existing Twilio card, creating a logical grouping of SMS-related costs and compliance requirements.

### Icon Choice
`Shield` icon (cyan color) to represent compliance/security requirements - differentiates from the phone icon used for general Twilio.

