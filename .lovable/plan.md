## Why Aura said "error" even though SMS + email arrived

The network log confirms `send-walkthrough-demo` returned `{ ok: true, sms_status: "sent" }` and the demo link was delivered. So the function succeeded — but **Aura still spoke an error**.

Root cause: **ElevenLabs client-tool timeout**. The ElevenLabs agent has a default client-tool wait of ~20 seconds. Our `send_walkthrough_demo` chain is heavy:

1. `send-walkthrough-demo` calls `create-demo-trial` synchronously
2. `create-demo-trial` provisions a full industry-loaded demo company (seeds appointments, leads, KB, agents, profile, etc.) — this consistently takes 20-40s
3. Then SMS via SignalWire + email via Resend
4. Only then do we return `{ ok: true, spoken: "..." }`

By the time we return, ElevenLabs has already given up on the tool call and told the agent "tool failed" — so Aura reads back her fallback "I had trouble…" line. Meanwhile the SMS/email still go out because the edge function kept running to completion.

This matches the symptom exactly: ✅ demo link delivered, ❌ Aura apologizes.

## Fix — return fast, finish in the background

Restructure `send-walkthrough-demo` so the HTTP response is sent within ~2 seconds and the heavy work continues via `EdgeRuntime.waitUntil(...)`.

### New flow

1. **Synchronously (fast, <2s):**
   - Validate inputs (industry/name/email/phone)
   - Canonicalize industry, refuse HIPAA-gated verticals
   - Rate-limit check against `demo_trials`
   - Build the spoken confirmation string immediately
   - Return `{ ok: true, spoken, industry, industry_label }` to ElevenLabs

2. **Background (`EdgeRuntime.waitUntil`):**
   - Insert prospect Lead on Aura tenant
   - Invoke `create-demo-trial`
   - Send SignalWire SMS with the share_url
   - Log failures to console (we no longer need them in the response)

### Spoken copy adjustment

Because the link is now sent moments after Aura speaks (not before), tweak wording slightly so it stays true:

> "Perfect, {firstName} — I'm sending your live {Industry} walkthrough to your text and email right now. It'll land in a few seconds; tap the link and I'll meet you inside the demo. It's good for 48 hours."

### Client tool

`AuraAvatarChat.tsx` already returns `{ ok, spoken }` from the function response — no client change needed. The toast that depends on `demo_url` will simply not fire (the URL is created in the background), which is fine since the user gets the link via SMS/email anyway. We can drop that toast branch or leave it as a no-op.

### Files touched

- `supabase/functions/send-walkthrough-demo/index.ts` — restructure to fast-return + `EdgeRuntime.waitUntil` background work, update `spoken` copy.

No DB migration, no client change required.

### Validation

1. Open `/`, Talk to Aura, request a Plumbing walkthrough demo for a real mobile number.
2. Aura should speak the confirmation within ~2s of finishing the request.
3. SMS + email arrive within ~30s (unchanged).
4. Edge function logs show the tool returned 200 quickly, then background `create-demo-trial` + SMS complete after.
