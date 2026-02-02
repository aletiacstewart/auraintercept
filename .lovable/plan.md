
# Aura Protocol Switching System Implementation Plan

## Overview
This plan implements a comprehensive protocol switching system for Aura that enables dynamic behavioral changes based on customer urgency, sentiment, and information needs. The system will support Emergency Mode, De-escalation Mode, and Contextual Sharing Mode across both voice and text channels.

---

## Phase 1: Database Schema

### 1.1 Smart Links Table
Create a new `smart_links` table to store company-specific URL mappings:

```text
┌─────────────────────────────────────────────────────────────┐
│                      smart_links                            │
├─────────────────────────────────────────────────────────────┤
│ id                  UUID (PK)                               │
│ company_id          UUID (FK → companies)                   │
│ category            TEXT (scheduling, pricing, reviews,     │
│                          invoicing, emergency, custom)      │
│ name                TEXT                                    │
│ description         TEXT                                    │
│ url                 TEXT                                    │
│ intent_triggers     TEXT[] (keywords that trigger this link)│
│ is_active           BOOLEAN                                 │
│ sort_order          INTEGER                                 │
│ created_at          TIMESTAMP                               │
│ updated_at          TIMESTAMP                               │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Protocol Switch Events Table
Track all protocol mode changes for analytics:

```text
┌─────────────────────────────────────────────────────────────┐
│                  protocol_switch_events                     │
├─────────────────────────────────────────────────────────────┤
│ id                  UUID (PK)                               │
│ company_id          UUID (FK → companies)                   │
│ conversation_id     TEXT                                    │
│ channel             TEXT (voice, text)                      │
│ previous_mode       TEXT                                    │
│ new_mode            TEXT (emergency, de_escalation,         │
│                          contextual_sharing, normal)        │
│ trigger_type        TEXT (keyword, sentiment, manual)       │
│ trigger_value       TEXT (the specific trigger detected)    │
│ confidence_score    DECIMAL                                 │
│ customer_phone      TEXT                                    │
│ customer_email      TEXT                                    │
│ metadata            JSONB                                   │
│ created_at          TIMESTAMP                               │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 Emergency Settings (Companies Table Extension)
Add emergency configuration fields to the companies table:

```text
New columns for companies table:
- emergency_phone TEXT (direct emergency line)
- emergency_sms_enabled BOOLEAN
- emergency_notification_emails TEXT[]
- emergency_keywords TEXT[] (custom keywords beyond defaults)
- de_escalation_manager_contact TEXT
- de_escalation_auto_ticket BOOLEAN
```

---

## Phase 2: Knowledge Base - Smart Links Tab

### 2.1 New Component: SmartLinksManager
Location: `src/components/knowledge/SmartLinksManager.tsx`

Features:
- CRUD operations for smart links
- Predefined categories with icons
- Intent trigger keyword management (comma-separated or tag input)
- Drag-and-drop reordering
- CSV import/export
- Toggle active/inactive state

### 2.2 Update Knowledge Base Page
Modify `src/pages/KnowledgeBase.tsx`:
- Add new "Smart Links" tab with Link2 icon
- Position after Documents tab

### 2.3 UI Design
Each smart link card displays:
- Category badge (color-coded)
- Link name and description
- URL (with copy button)
- Intent triggers as tags
- Active/Inactive toggle

Default categories with preset triggers:
| Category | Default Triggers | Icon |
|----------|-----------------|------|
| Scheduling | "book", "schedule", "appointment", "availability" | Calendar |
| Pricing | "how much", "price", "cost", "quote", "estimate" | DollarSign |
| Reviews | "reviews", "ratings", "reputation", "good" | Star |
| Invoicing | "pay", "invoice", "bill", "payment" | Receipt |
| Emergency | "emergency", "urgent", "after hours" | AlertTriangle |
| Custom | (user-defined) | Link |

---

## Phase 3: Protocol Switching Logic

### 3.1 Update AI Agent Chat Edge Function
Modify `supabase/functions/ai-agent-chat/index.ts`:

```text
Protocol Detection Flow:
┌──────────────────────────────────────────────────────────┐
│                   Incoming Message                        │
└────────────────────────┬─────────────────────────────────┘
                         │
          ┌──────────────▼──────────────┐
          │    Emergency Detection      │
          │    (Highest Priority)       │
          └──────────────┬──────────────┘
                         │
         ┌───────────────┴────────────────┐
         │                                │
    ┌────▼────┐                     ┌─────▼─────┐
    │  YES    │                     │    NO     │
    └────┬────┘                     └─────┬─────┘
         │                                │
    ┌────▼────────────────┐    ┌──────────▼──────────┐
    │  EMERGENCY MODE     │    │ Sentiment Analysis  │
    │  - Short responses  │    │ (De-escalation)     │
    │  - Safety first     │    └──────────┬──────────┘
    │  - Send emergency   │               │
    │    smart link       │    ┌──────────┴───────────┐
    │  - Notify on-call   │    │                      │
    └─────────────────────┘    ▼                      ▼
                          Frustrated              Neutral
                               │                      │
                    ┌──────────▼─────────┐  ┌─────────▼────────┐
                    │  DE-ESCALATION     │  │ Intent Detection │
                    │  - Empathy mode    │  │ (Smart Links)    │
                    │  - Log ticket      │  └─────────┬────────┘
                    │  - Manager contact │            │
                    └────────────────────┘   ┌───────▼────────┐
                                             │  Match Found?  │
                                             └───────┬────────┘
                                                     │
                                        ┌────────────┴────────────┐
                                        ▼                         ▼
                                    ┌───────┐                ┌────────┐
                                    │  YES  │                │   NO   │
                                    └───┬───┘                └────┬───┘
                                        │                         │
                              ┌─────────▼──────────┐    ┌─────────▼─────────┐
                              │ CONTEXTUAL SHARING │    │   NORMAL MODE     │
                              │ - Send smart link  │    │   (Continue as    │
                              │ - Verbal confirm   │    │    standard)      │
                              └────────────────────┘    └───────────────────┘
```

### 3.2 New Functions to Add

**detectProtocolMode()**: Analyzes message for emergency keywords, sentiment triggers, and intent patterns

**logProtocolSwitch()**: Records mode changes to `protocol_switch_events` table

**getSmartLinkForIntent()**: Queries `smart_links` table to find matching URL based on detected intent

**triggerMessageAura()**: Programmatically sends SMS via Twilio with the appropriate smart link (for voice channel)

### 3.3 Emergency Mode Implementation
- Expand existing `isEmergencyRequest()` function
- Load company-specific emergency keywords from database
- Add safety guardrail that blocks scheduling for life-safety issues
- Integrate with notification system for on-call alerts

### 3.4 De-escalation Mode Implementation
Sentiment triggers to detect:
- Profanity detection (word list)
- Escalation phrases: "cancel my service", "speak to manager", "third time", "not happy", "horrible", "worst"
- Tone patterns (multiple exclamation points, ALL CAPS)

Actions:
- Switch to empathy-first responses
- Auto-create priority support ticket
- Provide manager contact via Message Aura

### 3.5 Contextual Sharing Mode Implementation
- Match user intent against `smart_links.intent_triggers`
- Use fuzzy matching for variations ("book" matches "booking", "schedule")
- Channel-aware delivery:
  - **Text channel**: Embed link inline in response
  - **Voice channel**: Confirm verbally + trigger Message Aura SMS

---

## Phase 4: Emergency Configuration Settings

### 4.1 New Settings Section
Add to company settings page (or create dedicated section):

**Emergency Contact Settings**:
- Emergency phone number
- On-call notification emails (multi-select)
- Custom emergency keywords (tag input)
- Enable/disable emergency SMS

**De-escalation Settings**:
- Manager contact phone/email
- Auto-create ticket toggle
- Custom de-escalation phrases

---

## Phase 5: Analytics Dashboard

### 5.1 Protocol Switch Analytics
New dashboard card showing:
- Protocol switches by mode (pie chart)
- Switches over time (line chart)
- Top trigger keywords
- Channel breakdown (voice vs text)
- Resolution outcomes

### 5.2 Query for Analytics
```sql
SELECT 
  new_mode,
  channel,
  COUNT(*) as count,
  DATE_TRUNC('day', created_at) as date
FROM protocol_switch_events
WHERE company_id = $1
GROUP BY new_mode, channel, date
ORDER BY date DESC;
```

---

## Technical Summary

### Files to Create
1. `src/components/knowledge/SmartLinksManager.tsx` - New Knowledge Base tab component
2. Database migration for `smart_links` table
3. Database migration for `protocol_switch_events` table
4. Database migration for companies table extension

### Files to Modify
1. `src/pages/KnowledgeBase.tsx` - Add Smart Links tab
2. `supabase/functions/ai-agent-chat/index.ts` - Protocol switching logic
3. Company settings component - Emergency configuration

### RLS Policies Required
- `smart_links`: Company-scoped access (users can only see their company's links)
- `protocol_switch_events`: Company-scoped access for viewing, system insert for logging

### Default Smart Link Templates
On first company setup, auto-populate with empty templates:
- Scheduling (booking_url)
- Pricing (price_sheet_url)  
- Reviews (google_review_url)
- Invoicing (payment_portal)
- Emergency (emergency_contact_url)

---

## Implementation Order
1. Database migrations (smart_links, protocol_switch_events, companies extension)
2. SmartLinksManager component + Knowledge Base integration
3. Protocol detection functions in edge function
4. Protocol switch logging
5. Emergency configuration settings UI
6. Analytics dashboard integration
