---
name: Bilingual Language Standard (EN/ES)
description: How English/Spanish is configured and resolved across AI chat, browser voice, and phone calls
type: feature
---
Companies have `default_language` (`en`|`es`|`auto`) and `supported_languages` (text[]) on the `companies` table.

Resolution order:
1. Explicit `language` in the request (used by staff UI via i18n).
2. Company `default_language` (server-side fallback in `ai-agent-chat`).
3. `'en'` ultimate fallback.

`'auto'` mode adds a system directive telling the model to detect the customer's language from their first message/words and stay in it.

**Chat:** `ai-agent-chat` injects the language directive into every system prompt.

**Browser voice (ElevenLabs Convai):** `VoiceChat.tsx` and `AuraAvatarChat.tsx` pass `overrides.agent.language` to `conversation.startSession` based on i18n locale. Requires the ElevenLabs agent to have Spanish enabled under Voice → Additional Languages.

**Phone (SignalWire SWML):** `voice-handler` registers both `en-US` and `es-ES` entries in the SWML `languages` array when the company supports Spanish (or `default_language` is `es`/`auto`), with a language directive appended to the system prompt. Greeting is localized to Spanish when default is `es`.

UI: configured in **Settings → AI Agent → Languages** card (`AIAgentSettings.tsx`).

TODO (deferred): translate outbound SMS / reminder / missed-call copy via a per-language template lookup keyed off `customer.preferred_language ?? company.default_language`.