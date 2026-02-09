
## Full Teardown and Rebuild: Voice and SMS System

### Current State (What Exists Today)

The voice and SMS system has accumulated significant technical debt and bugs across **11 edge functions** and multiple UI components. Here is what currently exists:

**Edge Functions (Voice/SMS Related):**
1. `voice-handler` -- 764 lines, handles inbound calls, outbound call webhooks, speech processing, status callbacks
2. `sms-handler` -- 341 lines, handles inbound SMS with keyword auto-responder and AI replies
3. `outbound-call` -- 349 lines, initiates outbound calls via SignalWire (has a critical undefined variable bug)
4. `send-appointment-sms` -- sends SMS for appointment reminders
5. `missed-call-handler` -- handles missed call callbacks
6. `test-voice-reminder` -- test utility for voice reminders
7. `voice-navigator` -- "Ask Aura" staff voice navigation tool
8. `voice-booking-agent` -- voice-based booking agent
9. `elevenlabs-tts` -- text-to-speech via ElevenLabs API
10. `elevenlabs-post-call` -- post-call transcription webhook
11. `elevenlabs-conversation-token` -- token generation for web voice chat
12. `elevenlabs-clone-voice` -- voice cloning utility
13. `tts` -- generic TTS function

**UI Components:**
- `OutboundCallDialog` -- dialog to initiate outbound calls
- `VoiceChat` -- ElevenLabs web voice chat widget
- `SMSChat` -- SMS conversation interface
- `SMSIntegration` -- SignalWire SMS setup page
- `VoiceIntegration` -- voice setup page
- `MissedCallSettings` -- missed call callback settings
- `TTSProviderSettings` -- TTS configuration
- `AIAgentConsole` -- contains voice and SMS tabs

**Database Tables:**
- `call_logs` -- voice call records
- `sms_logs` -- SMS message records
- `sms_keywords` -- hashtag auto-responder keywords

**Storage Bucket:**
- `voice-audio` -- temporary ElevenLabs TTS audio files

### Known Bugs

1. **CRITICAL: `outbound-call` has undefined `signalwireUrl` variable** -- The variable is referenced on lines 207 and 211 but never declared. This means outbound calls crash immediately at runtime. This is the direct cause of "not getting outbound calls."
2. Empty body handling complexity with multiple fallback paths
3. In-memory conversation state in `voice-handler` that doesn't persist across function restarts
4. SMS Messages endpoint missing `.json` suffix (same pattern as the calls issue)

### Rebuild Plan

#### Phase 1: Delete All Voice/SMS Edge Functions

Remove these 13 edge functions:
- `voice-handler`
- `sms-handler`
- `outbound-call`
- `send-appointment-sms`
- `missed-call-handler`
- `test-voice-reminder`
- `voice-navigator`
- `voice-booking-agent`
- `elevenlabs-tts`
- `elevenlabs-post-call`
- `elevenlabs-conversation-token`
- `elevenlabs-clone-voice`
- `tts`

#### Phase 2: Rebuild Core Edge Functions (Clean Architecture)

Rebuild only the essential functions with clean, tested code:

**Function 1: `sms-handler` (Inbound SMS)**
- Parse SignalWire webhook (form-urlencoded)
- Normalize phone numbers (E.164)
- Look up company by phone number
- Keyword auto-responder check
- AI response via Lovable AI
- Reply via SignalWire Messages.json API (with `.json` suffix)
- Log to `sms_logs`
- Clean error handling with cXML fallback

**Function 2: `outbound-call` (Initiate Outbound Calls)**
- Accept JSON body with companyId, phone, name, purpose, message
- Subscription tier gating
- Pre-insert `call_logs` record
- Build short webhook URL with `callLogId` reference
- Call SignalWire `Calls.json` API (with `.json` suffix)
- Properly declare ALL variables before use
- Update call log with SID on success
- Defensive response parsing (text-first, then JSON.parse in try-catch)

**Function 3: `voice-handler` (SignalWire Webhooks)**
- Handle `action=incoming` (inbound call greeting)
- Handle `action=outbound` (outbound call message delivery, context from DB via `callLogId`)
- Handle `action=process` (speech input processing via AI)
- Handle `action=status` (call status updates)
- Handle `action=timeout` (no-speech timeout)
- Handle `action=outbound-response` (DTMF/speech responses)
- ElevenLabs TTS with storage upload and auto-cleanup
- Polly.Joanna fallback for TTS failures
- No in-memory state -- use `call_logs.metadata` for conversation context

**Function 4: `send-appointment-sms` (Outbound SMS)**
- Send appointment reminder/confirmation SMS
- Use SignalWire Messages.json API
- Log to `sms_logs`

**Function 5: `elevenlabs-conversation-token` (Web Voice Chat)**
- Generate conversation token for ElevenLabs web agent
- Simple, single-purpose function

**Function 6: `elevenlabs-post-call` (Post-Call Webhook)**
- Receive transcription data from ElevenLabs
- Map agent_id to company_id via `tenant_integrations`
- Persist to `call_logs`

#### Phase 3: Update UI Components

- Fix `OutboundCallDialog` to handle new response format
- Ensure `VoiceChat` works with rebuilt token function
- Ensure `SMSChat` works with rebuilt SMS function
- Update `AIAgentConsole` voice/SMS tab detection logic

#### Phase 4: Verify and Test

- Deploy all rebuilt functions
- Test outbound call flow end-to-end
- Test inbound SMS flow
- Test web voice chat
- Verify call and SMS logs are populated correctly

### What Gets Removed Permanently

- `voice-navigator` (staff voice nav -- can be re-added later if needed)
- `voice-booking-agent` (voice booking -- can be re-added later)
- `elevenlabs-clone-voice` (voice cloning utility)
- `elevenlabs-tts` (standalone TTS -- folded into voice-handler)
- `tts` (duplicate/generic TTS)
- `test-voice-reminder` (test utility)
- `missed-call-handler` (can be re-added later)

### What Gets Kept (Database)

- `call_logs` table -- no changes needed
- `sms_logs` table -- no changes needed
- `sms_keywords` table -- no changes needed
- `voice-audio` storage bucket -- still needed for TTS files

### Architecture Principles for Rebuild

1. **Always use `.json` suffix** on SignalWire LaML API endpoints
2. **Always declare all variables** before referencing them
3. **Defensive response parsing**: read as text first, then JSON.parse in try-catch
4. **No in-memory state** -- use database for all conversation context
5. **E.164 phone normalization** at every boundary
6. **Short webhook URLs** -- pass database IDs, not full payloads
7. **Consistent error responses** -- JSON for API calls, cXML for webhooks
