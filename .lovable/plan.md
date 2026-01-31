
# Comprehensive AI Automation Implementation Plan

## Overview
This plan implements four AI automation features across the platform to streamline content creation for companies, employees, and their customers.

---

## Feature 1: Add AI to SMS Templates

### Summary
Add AI content generation buttons to the SMS Templates Editor, mirroring the existing Email Templates implementation.

### Files to Modify
| File | Change |
|------|--------|
| `src/components/settings/SmsTemplatesEditor.tsx` | Add AIContentButton import and integrate into message field |
| `src/components/ai/AIContentButton.tsx` | Add new content type `sms_message` |
| `supabase/functions/generate-website-content/index.ts` | Add SMS-specific prompt configuration |

### Implementation Details
1. Import `AIContentButton` into SmsTemplatesEditor
2. Add sparkle button next to the "Message" label (line 259)
3. Add new `sms_message` content type with character limit awareness (160 chars)
4. Include template type context (confirmation, cancellation, reminder) in generation

### UI Placement
```
┌─────────────────────────────────────────┐
│ Message                    [AI Sparkle] │
│ ┌─────────────────────────────────────┐ │
│ │ SMS message textarea...             │ │
│ └─────────────────────────────────────┘ │
│ 145/160 characters                      │
└─────────────────────────────────────────┘
```

---

## Feature 2: Knowledge Base AI Generator

### Summary
Create a multi-step wizard that generates foundational knowledge base content (FAQs, services, business hours) from minimal company input.

### New Files to Create
| File | Purpose |
|------|---------|
| `src/components/knowledge/KnowledgeBaseWizard.tsx` | Main wizard component with 3 steps |
| `supabase/functions/generate-knowledge-base/index.ts` | Edge function for batch KB generation |

### Files to Modify
| File | Change |
|------|--------|
| `src/pages/KnowledgeBase.tsx` | Add "AI Generate" button in header |

### Wizard Steps
1. **Business Info** - Industry, service area, business type
2. **Content Selection** - Choose what to generate (FAQs, Services, Hours)
3. **Review & Confirm** - Preview generated items before saving

### Database Operations
- Batch insert into `faqs` table
- Batch insert into `services` table  
- Upsert into `business_hours` table

### UI Flow
```
Step 1: Business Context
┌─────────────────────────────────────────┐
│ [Sparkles] Knowledge Base Generator     │
│ Step 1 of 3: Business Information       │
├─────────────────────────────────────────┤
│ Primary Industry: [Select dropdown]     │
│ Service Area: [Input - e.g., Miami, FL] │
│ Business Type: [Select]                 │
│ Brief Description: [Textarea]           │
│                                         │
│           [Cancel]  [Next: Select →]    │
└─────────────────────────────────────────┘

Step 2: Content Selection
┌─────────────────────────────────────────┐
│ What would you like to generate?        │
├─────────────────────────────────────────┤
│ ☑ FAQs (10-15 common questions)         │
│ ☑ Services (5-8 typical services)       │
│ ☑ Business Hours (standard schedule)    │
│                                         │
│         [Back]  [Generate Content →]    │
└─────────────────────────────────────────┘

Step 3: Review
┌─────────────────────────────────────────┐
│ Generated Content Preview               │
├─────────────────────────────────────────┤
│ FAQs (12 items)           [Edit] [✓]    │
│ Services (6 items)        [Edit] [✓]    │
│ Business Hours            [Edit] [✓]    │
│                                         │
│         [Back]  [Save to Knowledge Base]│
└─────────────────────────────────────────┘
```

---

## Feature 3: AI Line Item Suggestions for Quotes/Invoices

### Summary
Add AI-powered line item description generation that creates professional descriptions based on selected services or manual input.

### Files to Modify
| File | Change |
|------|---------|
| `src/components/billing/forms/BusinessQuoteForm.tsx` | Add AI button next to line item description field |
| `src/components/billing/forms/InvoiceForm.tsx` | Add AI button next to line item description field |
| `src/components/ai/AIContentButton.tsx` | Add `line_item_description` content type |
| `supabase/functions/generate-website-content/index.ts` | Add line item prompt |

### Implementation Details
1. Add small AI sparkle button next to each line item description input
2. When clicked, generate professional description based on:
   - Service name (if linked to a service)
   - Industry context from AI Content Profile
   - Standard billing language best practices

### UI Placement (BusinessQuoteForm line ~328)
```
┌─────────────────────────────────────────────────────────┐
│ Description          Qty    Price    Total              │
│ ┌────────────────┐ ┌───┐ ┌──────┐ ┌──────┐            │
│ │ AC Repair...  [✨]│ │ 1 │ │ $150 │ │ $150 │ [X]      │
│ └────────────────┘ └───┘ └──────┘ └──────┘            │
└─────────────────────────────────────────────────────────┘
```

### AI Prompt Logic
- Input: Service name + company industry
- Output: Professional 1-2 sentence description
- Example: "AC Repair" → "Comprehensive air conditioning diagnostic and repair service including system inspection, refrigerant check, and component repair as needed."

---

## Feature 4: Campaign Series Generator

### Summary
Create a batch wizard that generates coordinated multi-touch marketing campaigns spanning multiple weeks with both Email and SMS touchpoints.

### New Files to Create
| File | Purpose |
|------|---------|
| `src/components/marketing/CampaignSeriesWizard.tsx` | Main wizard component |
| `supabase/functions/generate-campaign-series/index.ts` | Edge function for series generation |

### Files to Modify
| File | Change |
|------|--------|
| `src/pages/Campaigns.tsx` | Add "Batch Series" button next to "New Campaign" |

### Wizard Steps
1. **Series Configuration** - Name, duration (2-8 weeks), campaign type
2. **Channel Selection** - Email, SMS, or both
3. **Touchpoint Scheduling** - Frequency and timing of messages
4. **Review & Generate** - Preview all campaign touchpoints

### Campaign Series Structure
```
Week 1: Introduction Email + Welcome SMS
Week 2: Value Proposition Email
Week 3: Testimonial/Social Proof Email + Reminder SMS
Week 4: Limited Offer Email + Urgency SMS
```

### Database Operations
- Create multiple entries in `marketing_campaigns` table
- Link them via a `series_id` field (may need migration)
- Each touchpoint has scheduled_date, channel, and content

### UI Flow
```
Step 1: Series Setup
┌─────────────────────────────────────────┐
│ [Sparkles] Campaign Series Generator    │
│ Step 1 of 4: Series Configuration       │
├─────────────────────────────────────────┤
│ Series Name: [Input]                    │
│ Campaign Type: [promotional ▼]          │
│ Duration: [4 weeks ▼]                   │
│ Target Segment: [all customers ▼]       │
│                                         │
│           [Cancel]  [Configure →]       │
└─────────────────────────────────────────┘

Step 2: Channels
┌─────────────────────────────────────────┐
│ Select Communication Channels           │
├─────────────────────────────────────────┤
│ ☑ Email - Primary messaging             │
│ ☑ SMS - Quick reminders & urgency       │
│                                         │
│ Touchpoints per week: [2 ▼]             │
│                                         │
│           [Back]  [Schedule →]          │
└─────────────────────────────────────────┘

Step 3: Schedule Preview
┌─────────────────────────────────────────┐
│ Campaign Timeline                       │
├─────────────────────────────────────────┤
│ Week 1                                  │
│   📧 Day 1: Welcome Email               │
│   💬 Day 3: Follow-up SMS               │
│ Week 2                                  │
│   📧 Day 8: Value Proposition           │
│ Week 3                                  │
│   📧 Day 15: Social Proof               │
│   💬 Day 17: Reminder SMS               │
│ Week 4                                  │
│   📧 Day 22: Final Offer                │
│   💬 Day 24: Urgency SMS                │
│                                         │
│           [Back]  [Generate Content →]  │
└─────────────────────────────────────────┘

Step 4: Review Generated Content
┌─────────────────────────────────────────┐
│ Review & Save                           │
├─────────────────────────────────────────┤
│ [Generating 8 touchpoints...]           │
│ ✓ Week 1 Email: "Welcome to..."         │
│ ✓ Week 1 SMS: "Thanks for..."           │
│ ✓ Week 2 Email: "Did you know..."       │
│ ... (expandable preview)                │
│                                         │
│           [Back]  [Create Series]       │
└─────────────────────────────────────────┘
```

---

## Database Changes Required

### New Column for Campaign Series
```sql
ALTER TABLE marketing_campaigns 
ADD COLUMN series_id UUID REFERENCES marketing_campaigns(id),
ADD COLUMN series_order INTEGER,
ADD COLUMN scheduled_send_date TIMESTAMPTZ;
```

---

## Edge Functions to Create

### 1. generate-knowledge-base
- Input: industry, service_area, business_type, content_types[]
- Output: { faqs: [], services: [], business_hours: {} }
- Uses tool calling for structured output

### 2. generate-campaign-series  
- Input: series_config, touchpoint_schedule, company_context
- Output: Array of campaign objects with generated content
- Leverages Tavily for industry trends if connected

---

## Implementation Order
1. **SMS Templates AI** (smallest scope, establishes pattern)
2. **Quote/Invoice Line Items AI** (adds value to existing forms)
3. **Knowledge Base Generator** (new wizard, high impact)
4. **Campaign Series Generator** (largest scope, requires migration)

---

## Technical Notes
- All AI generation uses existing `generate-website-content` pattern
- New content types extend the CONTENT_PROMPTS object
- Wizards follow SocialBatchWizard inline card pattern
- Tool calling used for structured JSON output in batch generators
- Rate limit (429) and credit exhaustion (402) errors handled consistently
