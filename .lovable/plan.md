

# Update SignalWire Instructions to Correct Terminology

## Problem Identified
The webhook configuration instructions currently use **Twilio-style field names**, which don't match the SignalWire dashboard. Users are confused because the labels don't correspond to what they see in SignalWire.

---

## Changes Required

### 1. SignalWireSetupGuide.tsx - Webhook Step (Step 6)

**Current labels (Twilio terminology):**
- "Voice 'When a call comes in'"
- "Voice 'Call Status Callback'"
- "Voice 'Status Callback URL'"
- "Messaging 'When a message comes in'"

**Updated labels (SignalWire terminology):**
- "Call Request URL (Inbound)"
- "Call Status Callback URL"
- "Status Callback URL" (combine with above or clarify)
- "Message Request URL (Inbound)"

**Updated navigation instructions:**

```text
Before:
"In SignalWire Dashboard, go to Phone Numbers → select your number → Edit → Configure the Voice and Messaging webhook URLs."

After:
"In SignalWire Dashboard, go to Phone Numbers → click your number → Settings tab → scroll to 'LaML Webhooks' section. Configure the Call and Message Handler URLs."
```

**Specific line updates in Step 6 (lines 318-406):**

| Line | Current Text | Updated Text |
|------|--------------|--------------|
| 326 | Voice "When a call comes in" | Call Request URL (Inbound Calls) |
| 338 | Set to HTTP POST - Handles incoming calls with AI | Method: POST - Receives incoming call events |
| 346 | Voice "Call Status Callback" | Call Status Callback URL |
| 358 | Handles missed calls - triggers AI callback or SMS | Method: POST - Receives call completion events |
| 366 | Voice "Status Callback URL" | *(Remove - combine with above or clarify)* |
| 386 | Messaging "When a message comes in" | Message Request URL (Inbound SMS) |
| 398 | Set to HTTP POST - Handles inbound SMS with AI responses | Method: POST - Receives incoming SMS events |
| 403 | "Phone Numbers → select your number → Edit" | "Phone Numbers → click your number → Settings → LaML Webhooks" |

---

### 2. PlatformGuides.tsx - Integration Guide (lines 555-567)

Update the guide to reference SignalWire instead of Twilio:

```text
Before:
{
  title: 'Twilio Voice & SMS',
  steps: [
    'Navigate to Integrations → Voice Agent or SMS & Text',
    'Create Twilio account at twilio.com',
    'Obtain Account SID and Auth Token from Twilio Console',
    ...
  ]
}

After:
{
  title: 'SignalWire Voice & SMS',
  steps: [
    'Navigate to Integrations → Voice Agent or SMS & Text',
    'Create SignalWire account at signalwire.com',
    'Obtain Project ID and API Token from SignalWire Dashboard',
    'Note your Space URL (e.g., yourspace.signalwire.com)',
    'Purchase a phone number with Voice and SMS capabilities',
    'Enter credentials in the integration settings',
    'Configure LaML webhook URLs for call and message handling',
    'Test with your own phone number'
  ]
}
```

---

## Updated Webhook Configuration Section Preview

After the changes, Step 6 will display:

| Webhook Type | Label | Description |
|--------------|-------|-------------|
| Voice Inbound | **Call Request URL** | Method: POST - Receives incoming call events |
| Voice Status | **Call Status Callback URL** | Method: POST - Receives call status events & recordings |
| SMS Inbound | **Message Request URL** | Method: POST - Receives incoming SMS events |

And the navigation tip will read:
> "In SignalWire Dashboard: **Phone Numbers** → click your number → **Settings** tab → scroll to **LaML Webhooks** section"

---

## Files to Update

| File | Changes |
|------|---------|
| `src/components/integrations/SignalWireSetupGuide.tsx` | Update Step 6 webhook labels and navigation instructions |
| `src/pages/PlatformGuides.tsx` | Update "Twilio Voice & SMS" guide to "SignalWire Voice & SMS" |

