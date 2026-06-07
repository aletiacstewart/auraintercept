---
name: Voice Walkthrough Demo
description: Aura captures industry + contact info during a phone/web voice session and texts the prospect a one-tap link to a live industry-matched demo
type: feature
---

# Voice-Driven Live Walkthrough Demo

## Flow
- Phone (SignalWire → ElevenLabs Aura agent) or Web (`/talk-to-aura` → `VoiceChat`).
- Aura's system prompt forces capture of: industry → name → mobile → email → company name.
- Aura calls the `send_walkthrough_demo` client tool (web) or SWAIG function (phone).
- Backend: `supabase/functions/send-walkthrough-demo/index.ts`
  - `verify_jwt = false`
  - Canonicalizes industry via `toCanonicalIndustryId`
  - Refuses HIPAA-gated verticals via `isIndustryHipaaGated` → returns `{ ok:false, reason:'industry_unavailable', spoken: '...' }`
  - Rate-limited to 1 send per phone/email per 10 min (anti SMS-pumping)
  - Inserts prospect as a Lead on the Aura Intercept tenant (`04c57cbe-358e-4036-a3ad-b777a55f5be0`) so the `sms-guard` allowlist passes
  - Internally invokes `create-demo-trial` with the canonical industry → returns `share_url`
  - Sends SMS via `sendGuardedSms` with `source: 'aura'` on the Aura Intercept SignalWire line
  - Returns `{ ok, spoken, demo_url, industry, industry_label, expires_at, sms_status }`

## ElevenLabs Aura agent (manual dashboard config)
Register client tool `send_walkthrough_demo` with schema:
```json
{
  "industry": "enum: hvac, plumbing, electrical, roofing, solar, landscape, pool_spa, pest_control, appliance_repair, handyman, construction, auto_care, security_systems, real_estate, beauty_wellness, restaurants, personal_assistant, fencing, other",
  "name": "string",
  "phone": "string (E.164 preferred)",
  "email": "string",
  "company_name": "string (optional)"
}
```
Prompt: *"When the caller wants to see Aura in action, ask: industry → name → mobile number → email. Confirm each, then call `send_walkthrough_demo`. Read the returned `spoken` field back verbatim."*

## Web wiring
- `src/components/ai/VoiceChat.tsx` registers `send_walkthrough_demo` in `useConversation.clientTools` — invokes `supabase.functions.invoke('send-walkthrough-demo')` and returns the spoken response.

## Phone wiring (SWAIG)
- `supabase/functions/voice-swaig/index.ts` adds case `send_walkthrough_demo` that proxies args to the shared `send-walkthrough-demo` function and stores `demo_walkthrough_url` + `demo_industry` on `call_logs.metadata`.

## Industry matching guarantee
The resolved industry ID flows: client → canonicalizer → `create-demo-trial` → `companies.industry_vertical` → `useIndustryPack` on auto-login. The demo dashboard renders the correct pack (terminology, agent names, sample appointments/leads) without any extra wiring.