# Voice setup (ElevenLabs)

Aura's spoken voice runs on ElevenLabs. Calls themselves come in through SignalWire; ElevenLabs only produces the speech.

## Getting the right key

1. Sign in to ElevenLabs.
2. Profile menu → **API Keys** → **Create key**.
3. Copy the **secret value** shown once at creation. It starts with `sk_`.

The short identifier listed beside the key in the table is *not* the key. Pasting it saves fine in most tools but every request then fails with a 401. Connections rejects it with that exact explanation before you can save.

Optional: an **Agent ID** (starts with `agent_`) if you use a pre-built ElevenLabs conversational agent.

## Saving it

Connections (`/dashboard/integrations`) → **AI voice** → **Set up** → paste the key → Save. The field validates format as you type.

## Checking it works

- Connections → **Health** tab → **Check now**. The voice row calls `api.elevenlabs.io/v1/user` with the `xi-api-key` header and reports back.
- Or open **Talk to Aura** — it mints a short-lived conversation token; if that succeeds the key is valid.

## Common errors

| What you see | What it means | Fix |
| --- | --- | --- |
| "That looks like the key ID, not the key" | The short identifier was pasted | Recreate the key and copy the `sk_` value |
| 401 in the Health tab | Key deleted or rotated in ElevenLabs | Create a new key and save it |
| Quota / character limit error | The ElevenLabs plan ran out | Upgrade the ElevenLabs plan |
| Voice silent on calls but health green | SignalWire number not routed | Check the calls & texts connection and the business number |

## Where it lives in code

Edge functions: `elevenlabs-aura-token`, `elevenlabs-conversation-token`, `elevenlabs-tts`, `elevenlabs-clone-voice`, `elevenlabs-post-call`. Health probe: `supabase/functions/_shared/integration-probes.ts`. Field rules: `src/lib/integrationConfig.ts`.

ElevenLabs bills each company directly, separate from the Aura plan.
