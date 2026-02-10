

# Rebuild: TwiML to SignalWire SWML AI Agent

## Restore Point

Your current codebase version is preserved in Lovable's Version History (clock icon in sidebar). You can restore to this exact state at any time if needed.

## Summary

Replace the 1043-line TwiML voice pipeline with a ~350-line SWML-based system. SignalWire will handle AI, speech recognition, and text-to-speech natively, eliminating all hold loops and reducing response latency from 10-16 seconds to under 1 second.

## Changes

### 1. Rewrite `supabase/functions/voice-handler/index.ts` (1043 lines down to ~350)

**Remove entirely:**
- `ttsAudioUrl()` helper
- `buildPlayThenGather()` TwiML builder
- `HOLD_PHRASES` constant
- `startAIGreeting()` (replaced by SWML document builder)
- `handleProcess()` (~160 lines of race/timer/abort/TTS pipeline)
- `handlePickup()` (~130 lines of retry loop)
- `handleProcessBackground()` (~110 lines of background AI)
- `handleTimeout()` (~35 lines)
- `generateTTSAudio()` (~40 lines of ElevenLabs TTS + Storage upload)

**Keep as-is:**
- `normalizePhoneNumber()`
- `escapeXml()`, `escapeXmlUrl()`
- `twimlResponse()` (still needed for ring-first dial and outbound one-way calls)
- `handleOutbound()` (one-way reminder/followup calls stay TwiML-based)
- `handleOutboundResponse()` (DTMF handling for one-way calls)
- `handleStatus()` (call status callbacks)
- `handleDialStatus()` (but rewritten to return SWML instead of calling startAIGreeting)

**Rewrite:**
- `handleIncoming()`: Look up company, build SWML document, return JSON response (not TwiML)
- `handleDialStatus()`: When ring-first fails, return SWML document instead of TwiML greeting
- Router switch statement: Remove `process`, `pickup`, `process-background`, `timeout` cases

**New function: `buildSWMLDocument()`**
Builds the SWML JSON containing:
- Jessica's system prompt built from `buildPhoneSystemPrompt()` (kept)
- ElevenLabs voice: `elevenlabs.<voice_id>:eleven_flash_v2_5` (pulled from `tenant_integrations.elevenlabs_voice_id`)
- Custom greeting as `ai.prompt.first_sentence`
- Speech fillers for natural pauses: `["one moment", "hmm", "let me check"]`
- SWAIG function definitions pointing to the `voice-swaig` endpoint
- `post_prompt_url` pointing to `voice-post-prompt` endpoint
- Company ID and call log ID in `meta_data` so SWAIG functions know the context

**Response format change for SWML routes:**
- `handleIncoming` and `handleDialStatus` (AI takeover) will return `Content-Type: application/json` with the SWML document instead of `Content-Type: application/xml` with TwiML
- SignalWire auto-detects the response format

### 2. Create `supabase/functions/voice-swaig/index.ts` (new, ~250 lines)

SWAIG webhook handler for SignalWire AI tool calls. When the AI agent decides to perform an action during conversation, SignalWire POSTs to this endpoint.

**Functions handled:**
- `check_availability`: Queries `appointments` and `employees` tables, returns available time slots as text the AI speaks
- `book_appointment`: Creates an appointment record in the database, returns confirmation text
- `transfer_call`: Returns SWML action to connect caller to business owner's phone number
- `end_call`: Returns goodbye message and hangup action

**How it works:**
- SignalWire sends: `{ function: "check_availability", argument: { parsed: { service_type: "...", preferred_date: "..." } }, meta_data: { company_id: "...", call_log_id: "..." } }`
- The function routes based on `function` name, queries the database using `meta_data.company_id`, and returns: `{ response: "Text the AI will speak" }`
- For transfers, includes `action` array with SWML connect instructions

### 3. Create `supabase/functions/voice-post-prompt/index.ts` (new, ~80 lines)

Post-call summary handler. SignalWire sends conversation data after the AI call ends.

**What it does:**
- Receives the post-prompt summary from SignalWire
- Extracts the AI-generated summary text
- Updates the `call_logs` record (found via `meta_data.call_log_id`) with:
  - `summary`: AI-generated conversation summary
  - `status`: "completed"
  - `ended_at`: timestamp

### 4. Update `supabase/config.toml`

Add two new function entries:
```
[functions.voice-swaig]
verify_jwt = false

[functions.voice-post-prompt]
verify_jwt = false
```

Both use `verify_jwt = false` because SignalWire sends webhooks without JWT authentication.

## What Stays Unchanged

- **Outbound one-way calls** (reminders, follow-ups): These still use pre-generated TTS audio and TwiML since they are not interactive AI conversations. The `outbound-call` function and `handleOutbound`/`handleOutboundResponse` in voice-handler are untouched.
- **Web voice chat**: ElevenLabs Conversational AI via `elevenlabs-conversation-token` is completely separate.
- **SMS handling**: `sms-handler` is unrelated.
- **Dashboard, call logs, booking system**: All existing UI and database tables work as-is.
- **Company voice/prompt customization**: The database fields (`elevenlabs_voice_id`, `ai_agent_prompt`, `ai_voice_greeting`) are read dynamically and injected into SWML.

## No Database Changes Needed

All changes are edge function code only.

## SignalWire Setup Required (one-time)

No dashboard configuration needed. The SWML document returned by `voice-handler` tells SignalWire which ElevenLabs voice to use. However, for ElevenLabs voices specifically, you may need to add your ElevenLabs API key to SignalWire. If the voice doesn't work on the first test call, we'll check SignalWire's docs for the exact configuration step.

## Expected Outcome

| Metric | Before (TwiML) | After (SWML) |
|--------|----------------|--------------|
| Response latency | 10-16 seconds | Under 1 second |
| Hold phrases per call | 2-3 | 0 |
| Code lines (voice-handler) | 1043 | ~350 |
| Edge function calls per turn | 3-5 | 0-1 (only tool calls) |
| Conversation feel | Robotic, repetitive | Natural, real-time |

