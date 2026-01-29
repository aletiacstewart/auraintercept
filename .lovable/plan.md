
# Add Terms Agreement Checkbox to Talk to Aura + ElevenLabs Disclosure

## Overview

This plan adds a terms agreement checkbox to the "Talk to Aura" text chat widget and adds ElevenLabs disclosure requirements to both the Terms of Service and Privacy Policy pages.

---

## Changes Summary

| Component | Change |
|-----------|--------|
| LandingAIChat.tsx | Add terms checkbox before users can send their first message |
| TermsOfService.tsx | Add new Section 20: ElevenLabs AI Agent Disclosure |
| PrivacyPolicy.tsx | Add new Section 15: ElevenLabs AI Agent Disclosure |

---

## 1. Add Terms Checkbox to Talk to Aura Chat

**File:** `src/components/landing/LandingAIChat.tsx`

Currently, users can immediately start chatting without agreeing to terms. We will add:

- A state variable `termsAgreed` (defaults to `false`)
- A consent notice displayed before the first message can be sent
- Links to Terms of Service and Privacy Policy (opening in new tabs)
- The send button will be disabled until terms are accepted

**User Flow:**
1. User opens chat widget
2. Chat shows welcome message from Aura
3. Below the input field, a checkbox with terms agreement is displayed
4. User must check the box before they can send any message
5. Once agreed, the checkbox hides and the user can chat normally

---

## 2. Add ElevenLabs Disclosure to Terms of Service

**File:** `src/pages/TermsOfService.tsx`

Add **Section 20: ElevenLabs AI Agent Disclosure** with:

- Disclosure that users interact with AI, not humans
- Notice that conversations may be recorded and shared with ElevenLabs and third-party LLM providers
- Consent requirements for AI interactions
- Sample disclosure language as referenced in the ElevenLabs documentation
- Link to ElevenLabs Agents Platform Terms

---

## 3. Add ElevenLabs Disclosure to Privacy Policy

**File:** `src/pages/PrivacyPolicy.tsx`

Add **Section 15: ElevenLabs AI Agent Disclosure** with:

- Data collection related to ElevenLabs Agents (voice and text interactions)
- How conversation data is processed and shared
- Third-party disclosure to ElevenLabs and their LLM providers
- User consent acknowledgment
- Link to ElevenLabs Agents Platform Terms

---

## Technical Details

### LandingAIChat.tsx Changes

```text
New imports:
- Checkbox from @/components/ui/checkbox
- Link from react-router-dom

New state:
- termsAgreed: boolean (default false)

New UI (below input form):
- Consent notice with checkbox
- Links to /terms-of-service and /privacy-policy

Modified behavior:
- Send button disabled when !termsAgreed
- Checkbox hidden after terms are accepted (to keep interface clean)
```

### Terms of Service Section 20

```text
20. ElevenLabs AI Agent Disclosure

Notice:
- You are interacting with AI-powered agents, not human representatives
- Conversations may be recorded and shared with ElevenLabs and third-party LLM providers

Consent:
- By interacting with AI agents, you consent to recording and data sharing
- This includes text chat (Talk to Aura) and voice features (Proxy Voice Chat)

Sample disclosure:
"We use ElevenLabs Agents to power our AI customer service assistants..."

Reference:
- Link to ElevenLabs Agents Platform Terms
```

### Privacy Policy Section 15

```text
15. ElevenLabs AI Agent Disclosure

Data collected:
- Text and voice conversation content
- Interaction timestamps and metadata

Third-party sharing:
- ElevenLabs Inc.
- Third-party large language model providers

Purpose:
- Provide AI-powered customer service
- Improve products and services
- Train machine learning models
- Comply with applicable law

Reference:
- Link to ElevenLabs Agents Platform Terms
```

---

## Files Changed

1. `src/components/landing/LandingAIChat.tsx` - Add terms checkbox and consent logic
2. `src/pages/TermsOfService.tsx` - Add Section 20 for ElevenLabs disclosure
3. `src/pages/PrivacyPolicy.tsx` - Add Section 15 for ElevenLabs disclosure
