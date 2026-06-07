## Problem

The homepage "Talk to Aura" widget (`AuraAvatarChat.tsx`) connects to the sales ElevenLabs agent, which has a `send_walkthrough_demo` client tool configured. The React `useConversation()` call doesn't define `clientTools`, so when the agent tries to invoke it the SDK throws "Client tool with name send_walkthrough_demo is not defined on client".

The same tool is already implemented in `src/components/ai/VoiceChat.tsx` (lines 180–217). We just need to mirror it on the avatar widget.

## Fix

In `src/components/aura/AuraAvatarChat.tsx`, add a `clientTools` block to `useConversation({...})` with a single `send_walkthrough_demo` handler that:

- Calls `supabase.functions.invoke("send-walkthrough-demo", { body: { industry, name, email, phone, company_name, source: "voice_web" } })`, mapping `phone || mobile || phone_number` and `company_name || business_name`.
- On success: returns `JSON.stringify({ ok: true, spoken })` using `data.spoken` (fallback to the standard confirmation line). Also shows a toast when `data.demo_url` is present, matching VoiceChat copy.
- On failure: logs and returns `JSON.stringify({ ok: false, spoken: "I had trouble sending that — can a teammate text the demo link in a couple minutes?" })`.

No other client tools needed here (booking tools belong to tenant agents, not the sales agent).

## Validation

Open `/`, click "Talk to Aura", grant mic. Say "Send me an HVAC walkthrough demo, John, +15125551234". The agent collects info, calls `send_walkthrough_demo`, the edge function returns `spoken`, and the agent reads it back. No red toast appears. Network tab shows a 200 from `send-walkthrough-demo`.

## Out of scope

- No change to `VoiceChat.tsx` or the edge function.
- No UI copy or visual changes.
