# Platform connection audit — findings and fixes

I ran a read-only sweep of the live backend, the scheduled jobs, the service credentials, and every place the app calls a backend function. Most of the platform is healthy. Four real problems turned up.

## What's healthy

- All 115 backend functions are deployed; 29 scheduled jobs are active and running (reminders, campaigns, blog publishing, social posting, health checks, digests, billing dunning).
- Aura's AI brain is connected and answering — a live request succeeded today in 1.4 seconds.
- Stripe billing, Google Calendar, Resend email, and Meta social credentials are all present.
- Every backend function the app calls exists, except one (below).

## Problems found

### 1. The voice assistant key is rejected (high)
"Talk to Aura" voice sessions are failing. The stored ElevenLabs credential is an API **key ID**, not the actual key — the provider returns "invalid API key" on every attempt. Voice demos and voice agents will not start until the real key (starts with `sk_`) is saved.
Fix: you supply the correct key, I save it and re-test a live voice token.

### 2. The AI Help Center is calling a function that doesn't exist (high)
The in-app Help assistant calls a backend function named `lovable-ai` that was never created, so asking Help a question always errors.
Fix: point it at the existing AI chat function instead, and verify a real answer comes back.

### 3. Google Calendar is disconnected for a tenant (medium)
An open alert says calendar sync needs reconnecting; the inbound sync job keeps running against a dead connection.
Fix: surface a clear "Reconnect Google Calendar" prompt in the integration screen and clear the stale alert once reconnected.

### 4. Two tables are locked with no access rules (low)
`oauth_state_nonces` and `_cron_shared_secret` have security enabled but no rules, so nothing can read them except internal service code. This is safe today but will silently break if any user-facing code ever touches them.
Fix: add explicit service-only rules so the intent is recorded.

Also noted, not urgent: 15 old "Frontend Error" alerts from February–June are still marked new. I'll close them out as part of the cleanup.

## Technical notes

- Credentials referenced in code but not stored: `SITE_URL`, `ORCHESTRATOR_SECRET`, `RESEND_WEBHOOK_SECRET`, `SIGNALWIRE_SIGNING_SECRET`, `GOOGLE_OAUTH_CLIENT_ID/SECRET` (duplicate naming of the existing `GOOGLE_CLIENT_*`), `ELEVENLABS_API_KEY` (bare name alongside `PLATFORM_ELEVENLABS_API_KEY`), `AURA_TENANT_SEED_PASSWORD`, and the Resend/Tavily cap values. Most have code defaults; I'll confirm each has a fallback and consolidate the duplicate Google and ElevenLabs variable names to one name each.
- `src/components/help/AIHelpCenter.tsx:163` → re-target `supabase.functions.invoke('lovable-ai', …)` to `ai-agent-chat` with the help system prompt.
- Database linter: 147 informational items, all `SECURITY DEFINER` execute-grant warnings that are expected for this app's public RPC pattern — no action.
- Verification: after the fixes I'll call the voice token function, the help chat path, and re-run the integration health check, then report actual responses.
