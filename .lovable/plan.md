# Fix: Aura doesn't understand "demo for my industry"

## What's actually wrong

The `send-walkthrough-demo` edge function works, and `VoiceChat.tsx` wires a `send_walkthrough_demo` client tool — but Aura still doesn't recognize industry demo requests because:

1. **Voice mode (ElevenLabs):** the agent in the ElevenLabs dashboard doesn't have `send_walkthrough_demo` registered as a client tool, and its system prompt has no instruction to ask for industry + name + phone and call that tool. A client tool that isn't declared in the dashboard is invisible to the LLM, so Aura just chats around the request.
2. **Text mode / `/chat/aura-intercept`:** `ai-agent-chat` has zero awareness of the walkthrough demo flow — no tool, no prompt section. So typing "send me an HVAC demo" goes nowhere.
3. The existing `ElevenLabsToolChecklist` documents step 1 but nothing is enforced, and step 2 was never built.

## Plan

### 1. Add `send_walkthrough_demo` to text-mode (`ai-agent-chat`)
- Register a new tool on the `triage` (and `voice_receptionist`) agent in `supabase/functions/ai-agent-chat/index.ts`:
  - name: `send_walkthrough_demo`
  - params: `industry` (enum of supported industries from `send-walkthrough-demo`), `name`, `phone` (E.164), `email` (optional), `company_name` (optional)
  - execute: invokes the existing `send-walkthrough-demo` edge function with the service-role client and returns `{ ok, spoken, demo_url }`.
- Add a short prompt section ("LIVE WALKTHROUGH DEMO") explaining when to call it (whenever a prospect names an industry + asks for a demo/walkthrough/sample), what to collect first (industry → name → mobile), and to read back the `spoken` field.
- Text mode in `TalkToAura` and `/chat/aura-intercept` will then handle the request natively.

### 2. Push the same prompt context into voice mode via overrides
- In `VoiceChat.tsx`, when starting the ElevenLabs session for the Aura tenant, pass `overrides.agent.prompt.prompt` appending a short "LIVE WALKTHROUGH DEMO" instruction block + the supported industry list. (Overrides must already be enabled on the agent — that's a documented prerequisite, not a code change.)
- This guarantees the voice agent at least *knows* the flow exists. It still needs the client tool declared in the ElevenLabs dashboard to actually fire `send_walkthrough_demo` (see step 3).

### 3. Strengthen the dashboard checklist
- Update `ElevenLabsToolChecklist.tsx`:
  - Add a "Status" indicator that pings `tenant_integrations.elevenlabs_agent_id` to confirm the Aura agent is wired.
  - Make the JSON schema copy-block match exactly what `send-walkthrough-demo` accepts today (industry enum kept in sync with the edge function's allowed list).
  - Add an explicit "Enable prompt overrides" reminder so step 2 actually takes effect.

## Out of scope
- No backend changes to `send-walkthrough-demo` itself (already deployed and working).
- No changes to billing/voice credits.
- No new tables.

## Validation
- Text: open `/talk-to-aura`, flip to text mode, say "send me an HVAC demo, name John, 5125551212" → tool fires, SMS+email arrive, Aura reads back the spoken confirmation.
- Voice (after dashboard tool is registered): same prompt over voice → same result.
- `/chat/aura-intercept`: same flow works there too because it uses the same `ai-agent-chat` triage agent.

## Open question
The voice agent's ElevenLabs dashboard registration of `send_walkthrough_demo` is a manual step I can't perform for you. Steps 1–3 above are what I can build; want me to proceed?
