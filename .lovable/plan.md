

## Rebuild: 6 Removed Voice/SMS Edge Functions

### Overview

Six edge functions were removed during the teardown that UI components still depend on. This will cause runtime errors when users interact with voice navigation, voice cloning, the ElevenLabs booking agent webhook, test voice reminders, and missed call handling. Each function needs to be rebuilt following the clean architecture principles established in the rebuild.

---

### Function 1: `voice-navigator`

**Purpose**: "Ask Aura" -- staff voice navigation. Takes a voice command and current page context, returns an AI-interpreted action (navigate, click button, search, etc.)

**Called by**: `src/contexts/VoiceContext.tsx`, `src/hooks/useUnifiedAura.ts`

**Expected input** (JSON, JWT required):
- `command`: the voice command text
- `currentPage`: current route path
- `visibleButtons`, `visibleCards`, `visibleFields`: arrays of visible UI element labels

**Expected output**: `AIAction` object with `action`, `target`, `route`, `value`, `confidence`, `message`

**Implementation**:
- Use Lovable AI (`google/gemini-3-flash-preview`) to interpret the command
- System prompt maps commands to actions: navigate, click_button, click_card, search, fill_field, focus_field, open_form, scroll, unknown
- Use tool calling for structured output
- Handle 429/402 rate limit errors

---

### Function 2: `voice-booking-agent`

**Purpose**: ElevenLabs webhook endpoint. When an ElevenLabs voice agent triggers a tool call (e.g., "book appointment"), this function handles the server-side action.

**Called by**: ElevenLabs agent via webhook (configured in `ElevenLabsSetupGuide.tsx` at the URL `voice-booking-agent`)

**Expected input** (form-urlencoded or JSON from ElevenLabs, no JWT):
- Tool call parameters: customer name, phone, service type, date/time preferences
- Agent ID for company mapping

**Expected output**: JSON response to ElevenLabs with action result

**Implementation**:
- Parse ElevenLabs webhook payload
- Map agent_id to company_id via `tenant_integrations`
- Handle booking tools: check availability, create appointment, confirm booking
- Query `employees`, `services`, `appointments` tables
- Return structured result for ElevenLabs to speak back

---

### Function 3: `elevenlabs-clone-voice`

**Purpose**: Clone a custom voice using ElevenLabs Instant Voice Cloning API

**Called by**: `src/components/ai/VoiceCloningCard.tsx` via `fetch()` with FormData

**Expected input** (multipart FormData, JWT required):
- `company_id`: company identifier
- `voice_name`: name for the cloned voice
- `voice_description`: optional description
- `audio_0`, `audio_1`, ...: audio file samples

**Expected output**: JSON with `{ voice_id, voice_name }`

**Implementation**:
- Parse multipart FormData
- Fetch ElevenLabs API key from `tenant_integrations`
- Forward audio files to ElevenLabs `POST /v1/voices/add` (Instant Voice Cloning)
- Update `tenant_integrations.elevenlabs_voice_id` with the new voice ID
- Return the new voice ID

---

### Function 4: `elevenlabs-tts` (standalone TTS)

**Purpose**: Standalone text-to-speech endpoint for generating audio from text. Used by various UI components that need TTS outside of the voice-handler call flow.

**Called by**: Various components that need on-demand TTS

**Expected input** (JSON, JWT required):
- `text`: text to convert
- `voiceId`: optional voice ID override
- `companyId`: to look up ElevenLabs credentials

**Expected output**: Binary audio/mpeg response

**Implementation**:
- Fetch ElevenLabs credentials from `tenant_integrations` by company_id
- Call ElevenLabs TTS API with `eleven_turbo_v2_5` model
- Return raw audio bytes with `Content-Type: audio/mpeg`
- Use Jessica (`cgSgspJ2msm6clMCkdW9`) as default voice

---

### Function 5: `test-voice-reminder`

**Purpose**: Initiates a test outbound call to verify voice reminder setup

**Called by**: `src/components/company/ReminderSettings.tsx`

**Expected input** (JSON, JWT required):
- `phoneNumber`: E.164 phone number to call
- `callScript`: the reminder script text
- `companyId`: company identifier

**Expected output**: `{ success: true }` or error

**Implementation**:
- Thin wrapper around `outbound-call` logic
- Fetch SignalWire credentials from `tenant_integrations`
- Pre-insert a `call_logs` record with purpose `test_reminder`
- Call SignalWire `Calls.json` API with short webhook URL
- Uses the same patterns as rebuilt `outbound-call`

---

### Function 6: `missed-call-handler`

**Purpose**: SignalWire webhook called when a call goes unanswered. Triggers SMS and/or AI callback based on company settings.

**Called by**: SignalWire status callback (configured in `SignalWireSetupGuide.tsx`)

**Expected input** (form-urlencoded from SignalWire, no JWT):
- `From`, `To`, `CallSid`, `CallStatus`

**Expected output**: TwiML (empty Response) or JSON acknowledgment

**Implementation**:
- Parse SignalWire form data
- Normalize phone numbers to E.164
- Look up company by `signalwire_phone_number` in `tenant_integrations`
- Fetch company's `missed_call_action` setting
- If `sms_only` or `callback_then_sms`: send SMS via SignalWire `Messages.json`
- If `callback_only` or `callback_then_sms`: insert into `missed_call_callbacks` table, then call the `outbound-call` function internally
- Log to `call_logs` with direction `inbound` and status `missed`

---

### Config Updates

The `config.toml` already has entries for all 6 functions with the correct `verify_jwt` settings. No config changes needed.

### Files to Create

| File | JWT |
|---|---|
| `supabase/functions/voice-navigator/index.ts` | true |
| `supabase/functions/voice-booking-agent/index.ts` | false |
| `supabase/functions/elevenlabs-clone-voice/index.ts` | true |
| `supabase/functions/elevenlabs-tts/index.ts` | true |
| `supabase/functions/test-voice-reminder/index.ts` | true |
| `supabase/functions/missed-call-handler/index.ts` | false |

### Architecture Principles (carried forward)

1. All SignalWire API endpoints use `.json` suffix
2. All variables declared before use
3. Defensive response parsing (text-first, JSON.parse in try-catch)
4. No in-memory state -- database for all context
5. E.164 phone normalization at every boundary
6. Short webhook URLs with database ID references
7. cXML responses for SignalWire webhooks, JSON for API calls

