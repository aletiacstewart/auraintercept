

# Fix SignalWire Webhook Configuration Instructions

## Problem
The current instructions don't match the actual SignalWire Dashboard interface. Users can't find where to configure webhooks because the navigation path is incorrect.

---

## What SignalWire Dashboard Actually Looks Like

Based on the official SignalWire documentation, here's how webhook configuration actually works:

1. Go to **Phone Numbers** in your SignalWire Space
2. Click on the phone number you want to configure
3. Click **Edit Settings**
4. You'll see two sections: **Voice & Fax** and **Messaging**
5. Each section has a dropdown labeled **"When a Call/Message Comes In"**
6. Select **"LaML Webhooks"** from the dropdown (other options include RELAY, integrations, etc.)
7. A URL input field appears where you paste the webhook URL
8. Select **POST** as the method

---

## Changes Required

### File: `src/components/integrations/SignalWireSetupGuide.tsx`

**Update the navigation tip (lines 401-405):**

| Current Text | Corrected Text |
|--------------|----------------|
| "Phone Numbers → click your number → Settings tab → scroll to LaML Webhooks section" | "Phone Numbers → click your number → Edit Settings → Voice & Fax section (or Messaging section) → select 'LaML Webhooks' from the dropdown" |

**Add clearer field mapping:**

| Our Webhook | SignalWire Field | Section |
|-------------|-----------------|---------|
| Call Request URL | "When a Call Comes In" → LaML Webhooks → URL | Voice & Fax |
| Call Status Callback | Set via API only (StatusCallback parameter) | N/A |
| Message Request URL | "When a Message Comes In" → LaML Webhooks → URL | Messaging |

**Important clarification to add:**
- The "Status Callback URL" and "Call Status Callback URL" are NOT configured in the phone number settings UI
- These are set programmatically via the API when making/receiving calls (using `StatusCallback` parameter)
- Only the **inbound** webhooks are configured in the dashboard

---

## Updated Navigation Instructions

Replace the current tip box with more accurate step-by-step instructions:

```text
How to configure in SignalWire Dashboard:

1. Go to Phone Numbers and click your number
2. Click "Edit Settings" button

For Voice (inbound calls):
3. In the "Voice & Fax" section, find "When a Call Comes In"
4. Select "LaML Webhooks" from the dropdown
5. Paste the Call Request URL and select POST method

For SMS (inbound messages):  
6. In the "Messaging" section, find "When a Message Comes In"
7. Select "LaML Webhooks" from the dropdown
8. Paste the Message Request URL and select POST method

Note: Status callbacks are handled automatically by our system when making outbound calls.
```

---

## Files to Update

| File | Changes |
|------|---------|
| `src/components/integrations/SignalWireSetupGuide.tsx` | Update Step 6 with accurate navigation, clarify which webhooks go where, note that status callbacks are API-level |

