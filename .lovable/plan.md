
# Aura Intelligence Settings - Streamlined Implementation Plan

## Overview
Create a unified "Aura Intelligence" settings section that consolidates all AI-related company configuration, following the Master Logic pattern from the prompt. This will be a new tab in the existing Settings page with sections for Identity, Operations, Smart Links, and Emergency/Escalation settings, plus a Developer JSON Export.

---

## Phase 1: Database Schema Extension

### New Fields for `companies` Table
```sql
ALTER TABLE companies ADD COLUMN IF NOT EXISTS brand_tone TEXT DEFAULT 'professional';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS emergency_surcharge DECIMAL(10,2);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS manager_name TEXT;
```

| Field | Type | Purpose |
|-------|------|---------|
| `brand_tone` | TEXT | Controls AI response style (professional, friendly, technical) |
| `emergency_surcharge` | DECIMAL | After-hours/emergency service fee for AI to reference |
| `manager_name` | TEXT | Name of escalation manager (pairs with existing `de_escalation_manager_contact`) |

---

## Phase 2: New Settings Component

### File: `src/components/settings/AuraIntelligenceSettings.tsx`

A single-page configuration with collapsible sections using the existing Accordion component.

### Section 1: Identity ("The Who")
Using icons: User, MessageSquare

| Field | Type | Maps To |
|-------|------|---------|
| Company Name | Display only | `companies.name` |
| Brand Tone | Select | `companies.brand_tone` |
| Primary Office Phone | Phone input | `companies.contact_phone` |

Brand Tone Options:
- **Professional/Polite** - Formal, business-appropriate language
- **Friendly/Casual** - Warm, conversational style
- **Technical/Direct** - Concise, industry-specific terminology

### Section 2: Operations ("The Where and When")
Using icons: MapPin, Clock, DollarSign

| Field | Type | Maps To |
|-------|------|---------|
| Service ZIP Codes | Tag input | `companies.service_area_zip_codes` |
| Business Hours | Link to existing tab | Settings > Contact |
| Emergency Surcharge | Currency input | `companies.emergency_surcharge` |

### Section 3: Smart Links ("The How")
Using icon: Zap

| Content | Type |
|---------|------|
| Link to Knowledge Base | Button → `/knowledge-base?tab=smart-links` |
| Quick status display | Shows count of configured vs empty links |

This section links to the existing SmartLinksManager rather than duplicating functionality.

### Section 4: Emergency and Escalation ("Critical")
Using icons: ShieldAlert, Smile

| Field | Type | Maps To |
|-------|------|---------|
| Emergency Dispatch Line | Phone input | `companies.emergency_phone` |
| Emergency SMS Enabled | Toggle | `companies.emergency_sms_enabled` |
| Custom Emergency Keywords | Tag input | `companies.emergency_keywords` |
| Notification Emails | Multi-input | `companies.emergency_notification_emails` |
| Manager Name | Text input | `companies.manager_name` |
| Manager Direct Line | Phone input | `companies.de_escalation_manager_contact` |
| Auto-Create Ticket | Toggle | `companies.de_escalation_auto_ticket` |

### Section 5: Developer Export
Using icon: Code

Features:
- Read-only JSON preview showing all Master Logic + Custom Variables
- Copy to clipboard button
- Download as `.json` file button

JSON Export Structure:
```json
{
  "masterLogic": {
    "safety_first": {
      "keywords": ["smoke", "fire", "gas", "flood", ...],
      "action": "emergency_response_mode"
    },
    "sentiment_guard": {
      "triggers": ["cancel", "not happy", "manager", ...],
      "action": "de_escalation_mode"
    },
    "proactive_link": {
      "triggers": ["pricing", "booking", "reviews"],
      "action": "send_smart_link"
    }
  },
  "customVariables": {
    "company_name": "...",
    "brand_tone": "professional",
    "primary_office_phone": "...",
    "service_zips": [...],
    "emergency_surcharge": 150,
    "booking_url": "...",
    "quote_request_url": "...",
    "review_url": "...",
    "payment_portal_url": "...",
    "emergency_dispatch_line": "...",
    "manager_name": "...",
    "manager_direct_line": "..."
  },
  "generatedAt": "2026-02-02T..."
}
```

---

## Phase 3: Settings Page Integration

### Update: `src/pages/Settings.tsx`

Add new tab after existing tabs:
```typescript
<TabsTrigger value="aura-intelligence" className="flex items-center gap-1">
  <Brain className="w-3 h-3" />
  Aura Intelligence
</TabsTrigger>
```

Add to VALID_TABS array: `'aura-intelligence'`

---

## Phase 4: AI Agent Integration

### Update: `supabase/functions/ai-agent-chat/index.ts`

Modify the system prompt builder to incorporate `brand_tone`:

```typescript
function getBrandToneModifier(brandTone: string): string {
  switch (brandTone) {
    case 'friendly':
      return `COMMUNICATION STYLE: Be warm, conversational, and approachable. 
              Use casual language, contractions, and friendly expressions.
              Example: "Hey there! I'd be happy to help you out with that!"`;
    case 'technical':
      return `COMMUNICATION STYLE: Be direct, precise, and industry-focused.
              Use technical terminology when appropriate. Be concise.
              Example: "I can schedule that diagnostic for you. What's your availability?"`;
    case 'professional':
    default:
      return `COMMUNICATION STYLE: Be professional, courteous, and business-appropriate.
              Use formal but warm language. Maintain professionalism throughout.
              Example: "Thank you for contacting us. I would be pleased to assist you."`;
  }
}
```

Add `emergency_surcharge` to AI context when relevant:
- Include in pricing discussions
- Reference during after-hours/emergency calls

---

## Technical Summary

### Files to Create
1. `src/components/settings/AuraIntelligenceSettings.tsx` - Main settings component

### Files to Modify
1. `src/pages/Settings.tsx` - Add new tab
2. `supabase/functions/ai-agent-chat/index.ts` - Brand tone modifier, emergency surcharge context

### Database Migration
```sql
-- Add missing fields for Aura Intelligence configuration
ALTER TABLE companies ADD COLUMN IF NOT EXISTS brand_tone TEXT DEFAULT 'professional';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS emergency_surcharge DECIMAL(10,2);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS manager_name TEXT;

-- Add comments for documentation
COMMENT ON COLUMN companies.brand_tone IS 'AI communication style: professional, friendly, or technical';
COMMENT ON COLUMN companies.emergency_surcharge IS 'After-hours/emergency service fee displayed by AI';
COMMENT ON COLUMN companies.manager_name IS 'Name of manager for de-escalation routing';
```

---

## UI Component Structure

```text
AuraIntelligenceSettings
├── Card: Identity Section
│   ├── Company Name (readonly display)
│   ├── Brand Tone (Select)
│   └── Primary Phone (Input)
│
├── Card: Operations Section
│   ├── Service ZIP Codes (TagInput)
│   ├── Business Hours (Link to existing)
│   └── Emergency Surcharge (CurrencyInput)
│
├── Card: Smart Links Section
│   ├── Status Summary (X of Y configured)
│   └── "Manage Smart Links" Button → Knowledge Base
│
├── Card: Emergency & Escalation Section
│   ├── Emergency Dispatch Line (Input)
│   ├── Emergency SMS Toggle (Switch)
│   ├── Custom Keywords (TagInput)
│   ├── Notification Emails (MultiInput)
│   ├── Manager Name (Input)
│   ├── Manager Direct Line (Input)
│   └── Auto-Create Ticket (Switch)
│
└── Card: Developer Export Section
    ├── JSON Preview (CodeBlock, readonly)
    ├── Copy Button
    └── Download Button
```

---

## Implementation Order

1. Database migration (add brand_tone, emergency_surcharge, manager_name)
2. Create AuraIntelligenceSettings component
3. Integrate into Settings page
4. Update AI agent edge function with brand tone modifier
5. Test end-to-end configuration flow
