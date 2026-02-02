
# Platform-Wide Aura Naming Standardization & Tooltip Enhancement

## Overview
This plan addresses naming inconsistencies across the entire platform and adds helpful tooltips to improve user understanding of the Aura feature set.

---

## Standardized Naming Convention

| Feature ID | Correct Name | Description | Dependencies |
|------------|--------------|-------------|--------------|
| Text Chat | **Message Aura (Text)** | Customer-facing text chat widget | None (all tiers) |
| Voice Chat | **Talk to Aura (Voice)** | Customer-facing speech conversations | ElevenLabs + Twilio |
| Internal Voice | **Ask Aura** | Staff-only voice navigation tool | Internal only |
| SMS/Email | **Reminders** | Appointment & campaign notifications | Twilio (SMS only) |

---

## Phase 1: Core Settings Fixes

### 1.1 SmartWebsiteManager.tsx (Critical)
**Current (Wrong):**
- `show_chat_widget` labeled "Talk to Aura"
- `show_voice_widget` labeled "Proxy Voice Chat"

**Fix:**
```typescript
// Line ~838: Change toggle label
<p className="font-medium text-card-foreground">Message Aura (Text)</p>
<p className="text-sm text-card-foreground/70">Enable text chat widget for visitors</p>

// Line ~848: Change toggle label  
<p className="font-medium text-card-foreground">Talk to Aura (Voice)</p>
<p className="text-sm text-card-foreground/70">Enable voice conversations for visitors (requires ElevenLabs + Twilio)</p>
```

Add HelpTooltip imports and wrap labels with explanatory tooltips.

---

## Phase 2: Help Content Configuration

### 2.1 helpContentConfig.ts
**Replace all instances of:**
- "Talk to Aura (Text-Based)" → "Message Aura (Text)"
- "Proxy Voice Chat" → "Talk to Aura (Voice)"
- "Proxy Voice Chat (Speech-Based)" → "Talk to Aura (Voice)"

**Lines to update:**
- Line 58, 68, 70, 71, 393, 402, 406, 452, 457

### 2.2 PLATFORM_HIGHLIGHTS section
```typescript
aiChatWidget: {
  title: 'Message Aura (Text)',  // was "Talk to Aura (Text-Based)"
  description: 'Text-based chat using keyboard input - no external dependencies',
},
aiVoice: {
  title: 'Talk to Aura (Voice)',  // was "Proxy Voice Chat (Speech-Based)"
  description: 'Speech conversations via microphone/speakers - requires ElevenLabs + Twilio',
},
```

---

## Phase 3: Documentation PDFs

### Files to Update:
1. **PricingSummaryPDF.tsx** - Already correct, verify consistency
2. **ComprehensiveGuidesPDF.tsx** - Fix "Proxy Voice Chat" references (lines ~221, 247, 352, 355)
3. **CompanyGuidesPDF.tsx** - Standardize terminology
4. **PlatformDocumentPDF.tsx** - Fix "Voice Chat" reference (line ~1150)
5. **IndustryMarketingKitPDF.tsx** - Check for inconsistencies
6. **AIAgentGuidesPDF.tsx** - Verify naming

---

## Phase 4: Audit & Other Components

### 4.1 audit/types.ts
- Line 491: "Proxy Voice Chat (ElevenLabs)" → "Talk to Aura (Voice)"
- Line 509: "Proxy Voice Chat (ElevenLabs/Twilio)" → "Talk to Aura (Voice)"

### 4.2 IntegrationDocs.tsx
- Line 27: Already correct ("AI Chat Widget (Text-Based)")
- Add clarifying tooltip

### 4.3 SmartWebsiteVoiceButton.tsx
- Line 97: "Voice Chat with {companyName}" → "Talk to Aura - {companyName}"

### 4.4 Contact.tsx
- Line 276: "Start Voice Chat" → "Talk to Aura"

### 4.5 VoiceChat.tsx
- Lines 71, 110: Update toast messages

---

## Phase 5: Tooltip Enhancements

### 5.1 Create Tooltip Definitions File
Create `src/lib/featureTooltips.ts`:

```typescript
export const FEATURE_TOOLTIPS = {
  messageAura: {
    label: 'Message Aura (Text)',
    tooltip: 'Text-based chat where customers type questions and receive text responses. Works on ALL tiers with no external integrations needed.',
  },
  talkToAura: {
    label: 'Talk to Aura (Voice)',
    tooltip: 'Speech-based conversations using microphone and speakers. Customers speak naturally and hear AI voice responses. Requires ElevenLabs (voice synthesis) and Twilio (telephony).',
  },
  askAura: {
    label: 'Ask Aura',
    tooltip: 'Internal voice navigation for staff. Use voice commands to navigate the dashboard hands-free.',
  },
  smsReminders: {
    label: 'SMS Reminders',
    tooltip: 'Automated text message reminders for appointments, follow-ups, and campaigns. Requires Twilio integration.',
  },
  emailReminders: {
    label: 'Email Reminders',
    tooltip: 'Automated email notifications for appointments, confirmations, and marketing campaigns.',
  },
};
```

### 5.2 Add Tooltips to Key Settings Pages

**SmartWebsiteManager.tsx** - Add to each feature toggle:
```typescript
import { HelpTooltip } from '@/components/ui/HelpTooltip';

<div className="flex items-center gap-1">
  <HelpTooltip 
    term="Message Aura (Text)" 
    tooltip={FEATURE_TOOLTIPS.messageAura.tooltip}
  />
</div>
```

### 5.3 Console Header Tooltips
Add tooltips to console headers explaining each console's purpose:
- Customer Portal Console
- Field Operations Console
- Business Management Console
- Marketing & Sales Console (→ "Outreach & Sales Ops")
- Analytics & Reports Console
- Social Media Signal Console

---

## Phase 6: AgentHowToGuide Enhancement

### 6.1 Update AgentHowToGuide.tsx
Add a "Communication Methods" section explaining:
- Message Aura (Text) - How to use text chat
- Talk to Aura (Voice) - How to use voice (if enabled)
- Ask Aura - How staff can use voice navigation

---

## Files Summary

| File | Changes |
|------|---------|
| `src/pages/SmartWebsiteManager.tsx` | Fix toggle labels, add tooltips |
| `src/lib/helpContentConfig.ts` | Standardize all naming (9+ instances) |
| `src/lib/featureTooltips.ts` | NEW - Centralized tooltip definitions |
| `src/components/documentation/*.tsx` | Update 6 PDF files |
| `src/components/audit/types.ts` | Fix 2 naming instances |
| `src/pages/IntegrationDocs.tsx` | Add clarifying tooltips |
| `src/components/smartwebsite/SmartWebsiteVoiceButton.tsx` | Update dialog title |
| `src/pages/Contact.tsx` | Update button label |
| `src/components/ai/VoiceChat.tsx` | Update toast messages |
| `src/components/ai/chat/AgentHowToGuide.tsx` | Add communication methods section |

---

## Expected Outcome

After implementation:
1. **Consistent naming** - "Message Aura (Text)" and "Talk to Aura (Voice)" used everywhere
2. **Clear tooltips** - Users understand what each feature does and what it requires
3. **No confusion** - Companies and customers know exactly which Aura feature they're using
4. **Documentation aligned** - All PDFs and guides use standardized terminology
