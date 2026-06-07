## Goal

Make the "Talk to Aura" voice widget (and all other places using `PLATFORM_AURA_AGENT_ID`) connect to the sales ElevenLabs ConvAI agent `agent_0501kh52gehge14vjscb5n8j8vhn` instead of the current support agent. UI copy stays "Aura / Talk to Aura".

## Change

Update the `PLATFORM_AURA_AGENT_ID` edge-function secret:

- Current value: `agent_5301kr2nbajrf5nbw9htby96dqmd`
- New value: `agent_0501kh52gehge14vjscb5n8j8vhn`

No code changes needed — `supabase/functions/elevenlabs-aura-token/index.ts` and other token endpoints already read this env var and request a WebRTC conversation token from ElevenLabs for whatever ID is set.

## Steps

1. Update the `PLATFORM_AURA_AGENT_ID` secret to the sales agent ID via the secrets tool.
2. Redeploy the affected edge functions so they pick up the new value: `elevenlabs-aura-token` (plus any other functions that read `PLATFORM_AURA_AGENT_ID`, confirmed via grep before deploy).

## Validation

Open the homepage, click "Talk to Aura", grant mic permission. Confirm the agent that answers is the sales persona (introduces itself accordingly). Network tab: `elevenlabs-aura-token` returns `{ token, agentId: "agent_0501kh52gehge14vjscb5n8j8vhn" }`.

## Out of scope

- No UI copy changes (still says "Aura / Talk to Aura").
- No new edge functions or new secret keys.
- Tenant-level ElevenLabs voice agents for customer companies are untouched.
