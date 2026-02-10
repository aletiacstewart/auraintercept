

# Fix Telephony Voice: Use ElevenLabs Jessica + Sequential Data Collection

## Root Cause

Your platform has **two separate voice delivery paths** (as noted in the architecture):

1. **Web Voice Chat** -- Uses the ElevenLabs Conversational AI Agent directly. The dashboard settings (Eagerness: Patient, etc.) and the system prompt we updated apply here.
2. **Phone Calls (SignalWire)** -- Uses the `voice-handler` edge function. This path does NOT use the ElevenLabs Agent at all. It currently uses **Amazon Polly "Joanna"** for all speech and has no sequential data collection logic.

This is why you hear a different voice on the phone and why it doesn't pause -- the phone path completely bypasses your ElevenLabs Agent configuration.

## What Needs to Change

### 1. Replace Polly with ElevenLabs TTS (Jessica) for Inbound Calls

The `voice-handler` already has a `generateTTSAudio()` helper function that uses ElevenLabs TTS with the Jessica voice, but it's **never called for inbound calls**. Currently, every inbound response uses `<Say voice="Polly.Joanna">`.

**Fix:** For inbound calls, generate TTS audio via ElevenLabs (Jessica), upload it to storage, and use `<Play>` instead of `<Say>`. Fall back to Polly only if ElevenLabs fails.

### 2. Add Conversation State Tracking for Sequential Data Collection

The current inbound flow is stateless -- each speech turn goes to the AI, gets a response, and loops. There's no mechanism to enforce "ask for name first, then phone, then address."

**Fix:** Add conversation state to the `call_logs.metadata` field to track:
- What info has been collected (name, phone, address)
- Conversation history (so the AI has context across turns)

Then update the system prompt sent to `ai-agent-chat` to include explicit sequential collection rules matching what we added to the ElevenLabs Agent prompt.

### 3. Update the AI System Prompt for Phone Calls

The current inbound prompt is minimal:
```
"You are a helpful phone assistant for [company]. Keep responses brief and conversational."
```

Replace this with the company's full `ai_agent_prompt` (which already has the sequential collection rules) plus phone-specific instructions like:
- Keep responses under 2 sentences (for TTS cost/latency)
- No markdown formatting, no bullet points
- Ask for ONE piece of info at a time

## Technical Changes

### File: `supabase/functions/voice-handler/index.ts`

**A. Update `handleIncoming()`:**
- Fetch ElevenLabs credentials alongside company data
- Generate the greeting via ElevenLabs TTS instead of Polly
- Initialize conversation state in call_logs metadata
- Fall back to Polly if TTS fails

**B. Update `handleProcess()`:**
- Load conversation history from call_logs metadata
- Append the new user speech to conversation history
- Send full history + enhanced system prompt to ai-agent-chat
- Generate AI response audio via ElevenLabs TTS
- Save updated conversation state back to call_logs
- Use `<Play>` for the TTS audio, fall back to `<Say voice="Polly.Joanna">` if TTS fails

**C. Update system prompt construction:**
- Use the company's `ai_agent_prompt` if available
- Append phone-specific rules:
  - "You are speaking on a PHONE CALL. Keep responses to 1-2 short sentences."
  - "Do NOT use any formatting, bullet points, or special characters."
  - "Ask for ONE piece of information at a time. WAIT for the answer before asking the next question."
  - "NEVER ask for name, phone, AND address in the same question."

**D. Update `handleTimeout()`:**
- Use ElevenLabs TTS for the timeout message too (with Polly fallback)

### File: No other files need changes

This is entirely a backend (edge function) change. The dashboard UI, web voice chat, and all frontend code remain unchanged.

## Flow After Fix

```text
Phone call comes in via SignalWire
        |
        v
voice-handler (action=incoming)
        |
        v
Look up company + ElevenLabs credentials
        |
        v
Generate greeting via ElevenLabs TTS (Jessica voice)
Upload to storage, get public URL
        |
        v
Return TwiML: <Gather><Play>[jessica-audio-url]</Play></Gather>
        |
        v
Caller speaks -> SignalWire sends speech text
        |
        v
voice-handler (action=process)
        |
        v
Load conversation history from call_logs metadata
Add user message to history
        |
        v
Send to ai-agent-chat with sequential collection prompt
AI responds with ONE question at a time
        |
        v
Generate response via ElevenLabs TTS (Jessica voice)
Save updated history to call_logs
        |
        v
Return TwiML: <Gather><Play>[jessica-response-url]</Play></Gather>
        |
        v
Loop until conversation ends
```

## Tradeoffs

- **Latency**: Each turn now requires an ElevenLabs TTS API call + storage upload before responding. The `eleven_turbo_v2_5` model is optimized for speed, and the audio files are small (1-2 sentences). Expected added latency: 1-2 seconds per turn.
- **Cost**: Each turn generates a small ElevenLabs TTS request. This is the same approach already used for outbound calls.
- **Reliability**: Polly fallback ensures calls never hang up if ElevenLabs is down.

