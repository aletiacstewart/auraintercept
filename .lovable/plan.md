

# ElevenLabs Voice Agent - Complete Enhancement Plan

This plan adds all the recommended ElevenLabs configurations to your Aura platform: Knowledge Base guidance, First Message setup, Analysis tab instructions, and a Post-Call Webhook to log voice conversations.

---

## Overview

| Enhancement | What It Does |
|-------------|--------------|
| **1. First Message** | Agent greets caller immediately instead of waiting |
| **2. Knowledge Base** | Agent can answer FAQs beyond just booking |
| **3. Post-Call Webhook** | Log all voice conversations in your dashboard |
| **4. Analysis Tab** | Track call success rates and sentiment |

---

## 1. First Message Configuration

**Location**: ElevenLabs Dashboard → Agent → Advanced Settings

Add guidance to the setup guide explaining how to configure a welcoming first message so the agent doesn't wait silently.

**Recommended First Message**:
```
Hi! Thanks for calling. I'm Aura, your scheduling assistant. I can help you book an appointment, answer questions about our services, or check on an existing booking. How can I help you today?
```

**File Changes**: `src/components/integrations/ElevenLabsSetupGuide.tsx`
- Add new accordion step "Configure First Message"
- Include recommended first message text with copy button
- Explain the benefit (agent initiates conversation)

---

## 2. Knowledge Base Guidance

**Location**: ElevenLabs Dashboard → Agent → Knowledge Base

Help users upload their FAQs, service descriptions, and policies so the agent can answer questions beyond booking.

**Recommended Content to Upload**:
- Service descriptions from Aura Knowledge Base
- FAQ documents (pricing, service areas, cancellation policy)
- Company policies

**File Changes**: `src/components/integrations/ElevenLabsSetupGuide.tsx`
- Add new accordion step "Add Knowledge Base"
- Link to export FAQ/services feature
- List recommended document types
- Include tips for formatting content

---

## 3. Post-Call Webhook (Conversation Logging)

Create a new edge function to receive ElevenLabs post-call data and log it to the existing `call_logs` table.

### Database Schema

The existing `call_logs` table already has the required columns:
- `transcript` (jsonb) - Store conversation transcript
- `summary` (text) - AI-generated call summary
- `duration_seconds` (integer) - Call duration
- `recording_url` (text) - Link to recording
- `metadata` (jsonb) - Additional ElevenLabs data

### New Edge Function: `elevenlabs-post-call`

```typescript
// Receives webhook from ElevenLabs after each call
// Parses conversation data
// Logs to call_logs table
// Extracts: transcript, duration, outcome, sentiment
```

**Webhook URL**: `https://zwlcwtgjvesbevheknbk.supabase.co/functions/v1/elevenlabs-post-call`

**ElevenLabs sends**:
- `conversation_id` - Unique call identifier
- `transcript` - Full conversation text
- `duration_seconds` - Call length
- `analysis` - Optional sentiment/success metrics
- `agent_id` - Which agent handled the call

**File Changes**:
1. Create `supabase/functions/elevenlabs-post-call/index.ts`
2. Update `src/components/integrations/ElevenLabsSetupGuide.tsx` with setup instructions

---

## 4. Analysis Tab Configuration

**Location**: ElevenLabs Dashboard → Agent → Analysis

Guide users to configure:
- **Success Criteria**: "Was an appointment booked?"
- **Data Collection**: Customer name, phone, service type
- **Sentiment Analysis**: Enabled

**File Changes**: `src/components/integrations/ElevenLabsSetupGuide.tsx`
- Add new accordion step "Set Up Call Analytics"
- Explain each analysis setting
- Provide recommended success criteria

---

## Implementation Summary

### Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/elevenlabs-post-call/index.ts` | Webhook handler for post-call logging |

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/integrations/ElevenLabsSetupGuide.tsx` | Add 4 new accordion sections |

### New Accordion Sections

```
Step 5: Configure First Message
Step 6: Add Knowledge Base (Optional)
Step 7: Set Up Post-Call Logging (Optional)
Step 8: Configure Call Analytics (Optional)
```

---

## Technical Details

### Post-Call Webhook Flow

```text
ElevenLabs Call Ends
        ↓
POST to /functions/v1/elevenlabs-post-call
        ↓
Parse agent_id → Look up company_id from tenant_integrations
        ↓
Insert into call_logs table
        ↓
{transcript, duration, summary, metadata}
```

### Edge Function: elevenlabs-post-call

```typescript
// Key implementation points:

1. Receive ElevenLabs webhook payload
2. Extract agent_id to find company
3. Parse transcript into structured format
4. Insert into call_logs with:
   - direction: 'inbound'
   - status: 'completed'
   - purpose: 'voice_booking_agent'
   - transcript: conversation array
   - metadata: full ElevenLabs response
```

### Setup Guide Updates

The guide will be reorganized with clear sections:
- **Required Steps** (1-4): Current tool setup
- **Optional Enhancements** (5-8): New features

Each new section includes:
- Clear instructions
- Copy-pasteable values
- Benefits explanation

---

## User Action Required After Implementation

Once I implement these changes, you'll need to:

1. **In ElevenLabs Dashboard**:
   - Add First Message in Advanced Settings
   - Upload Knowledge Base documents
   - Add Post-Call Webhook URL
   - Configure Analysis tab

2. **In Aura Dashboard**:
   - Export FAQs/Services for Knowledge Base upload
   - View logged calls in the call history

