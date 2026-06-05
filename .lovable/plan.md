# Enable Spanish for AI Chat & Voice

## What's already in place
- **Text chat backend** (`ai-agent-chat`) already accepts `language: 'en' | 'es'` and injects a Spanish system directive. `useUnifiedAura` and `useMultiAgentChat` already forward `language` based on the user's i18n locale.
- **Language toggle UI** (`LanguageToggle` + `LanguageContext`) exists and persists to `profiles.preferred_language`.

## What's missing
1. **ElevenLabs voice (browser + phone)** — `startSession` calls in `VoiceChat.tsx` and `AuraAvatarChat.tsx` never pass `overrides.agent.language`, so the voice agent stays English even when the UI is Spanish.
2. **SignalWire phone calls** — the same ElevenLabs agent is used for inbound/outbound phone; needs Spanish either via agent config or a per-company "default voice language" setting.
3. **SMS / email / voicemail auto-responses** (`sms-handler`, `appointment-reminders`, missed-call follow-up) currently hard-code English copy.
4. **Per-company default language** — today language is driven by the *staff user's* UI locale. Customers on the public chat widget / phone line need a **company-level default** plus optional auto-detection from the caller's first utterance.
5. **ElevenLabs dashboard config** — each company's Convai agent must have Spanish added as an "Additional language" in the ElevenLabs UI for voice overrides to work (one-time provider setup, documented in the integration guide).

## Plan

### 1. Company-level language settings
- Add `default_language` (`en` | `es` | `auto`, default `en`) and `supported_languages` (`['en']` or `['en','es']`) to `companies`.
- Surface in **Settings → AI & Voice** with a short explainer: "Aura will reply in this language by default. 'Auto' detects from the customer's first message."

### 2. Text chat
- When resolving `language` in `useUnifiedAura` / `useMultiAgentChat` and the public chat widget, fall back to `company.default_language` (instead of always `'en'`) when there's no staff locale.
- In `ai-agent-chat`, when `language === 'auto'`, add a system instruction: *"Detect the user's language from their first message; reply in Spanish if they write Spanish, otherwise English. Stay in that language for the rest of the conversation."*

### 3. ElevenLabs voice (browser & avatar)
- Pass `overrides: { agent: { language: 'es' } }` to `conversation.startSession` in `VoiceChat.tsx` and `AuraAvatarChat.tsx` when the resolved language is Spanish.
- Also translate the contextual update string ("Today's date is…/Let me check on that…") to Spanish in that path.

### 4. Phone calls (SignalWire → ElevenLabs)
- In `voice-handler` / `elevenlabs-conversation-token` / `outbound-call`, read `company.default_language` and forward it as the agent override when minting the token / connecting the call.
- For TTS-only paths (`elevenlabs-tts`, `test-voice-reminder`, `outbound-call`), keep `eleven_turbo_v2_5` (already multilingual-capable) and pick a Spanish-friendly voice id when language is `es` (configurable per company, default to a known multilingual voice).

### 5. Customer-facing copy (SMS, voicemail, reminders)
- Add a small `t(key, lang)` helper with Spanish strings for: missed-call SMS, appointment reminders, booking confirmations, after-hours auto-reply, keyword auto-responder fallback.
- Each handler chooses the language from (customer.preferred_language ?? company.default_language).

### 6. Provider setup doc
- Update `ElevenLabsSetupGuide` with a one-step note: "In your ElevenLabs agent → Voice → Additional Languages, add Spanish (es). Aura will switch automatically based on the caller."

### 7. QA checklist
- Spanish UI → Aura chat replies in Spanish.
- Spanish UI → browser voice replies in Spanish (verify in ElevenLabs dashboard logs).
- Company set to `auto` → English caller gets English, Spanish caller gets Spanish, on both chat and phone.
- Missed-call SMS to a Spanish-preferred customer arrives in Spanish.

## Technical notes
- Backend already validates `language` to `'en' | 'es'`; extend to accept `'auto'` and resolve server-side before building the prompt.
- No new third-party providers — ElevenLabs Convai supports per-session language overrides; `eleven_turbo_v2_5` is multilingual.
- No pricing/tier changes; Spanish is a platform capability, not a paid add-on.
- LEGACY_TIER_MAP, Stripe IDs, and the 60-day trial flow are untouched.
