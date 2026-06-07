# Voice-Driven Live Walkthrough Demo (Industry-Matched)

When a prospect calls the Aura sales number or starts an in-browser "Talk to Aura" voice session, Aura asks **what industry they're in**, qualifies them, and texts/emails them a one-tap link to a **live walkthrough demo pre-loaded with their industry's pack** (HVAC sees HVAC, plumbing sees plumbing, etc.).

## What you already have

- `TalkToAura.tsx` + `VoiceChat` (in-browser ElevenLabs voice)
- `elevenlabs-aura-token`, `voice-handler`, `voice-swaig` (phone-call entry)
- `create-demo-trial` (industry-scoped 24h demo provisioning — already keyed off `industry_vertical`)
- 22 visible industry packs (4 HIPAA-gated verticals hidden)
- SignalWire (SMS), Lovable Email / Resend, Twilio connector

## Architecture

```text
   Phone ─► SignalWire → voice-handler ─┐
                                         ├─► ElevenLabs Aura agent (voice)
   Web ───► /talk-to-aura → VoiceChat ──┘                │
                                                         │ client tool:
                                                         │ send_walkthrough_demo
                                                         ▼
                                  ┌──────────────────────────────────────┐
                                  │ EF: send-walkthrough-demo            │
                                  │  1. canonicalize industry            │
                                  │  2. refuse if HIPAA-gated            │
                                  │  3. create-demo-trial(industry)      │
                                  │  4. mint 24h signed magic link       │
                                  │  5. SMS + Email link to prospect     │
                                  │  6. log to leads + call_logs         │
                                  └──────────────────────────────────────┘
```

## Industry matching — the core requirement

Aura's system prompt forces an industry capture **before** the tool can fire:

> *Step 1: Ask "What industry is your business in?" Map their answer to one of: HVAC, Plumbing, Electrical, Roofing, Solar, Landscaping, Pool & Spa, Pest Control, Appliance Repair, Handyman, Construction, Auto Care, Security Systems, Real Estate, Beauty & Wellness, Restaurants, Personal Assistant, Fencing. Confirm out loud: "Got it — HVAC. I'll set up a live HVAC walkthrough for you." If they say a vertical not on that list, offer the closest match OR tag as "other".*

The `send_walkthrough_demo` client tool schema enforces it server-side too:

```text
{
  industry: enum[hvac, plumbing, electrical, roofing, solar, landscape,
                 pool_spa, pest_control, appliance_repair, handyman,
                 construction, auto_care, security_systems, real_estate,
                 beauty_wellness, restaurants, personal_assistant, fencing, other],
  name: string,
  phone: string (E.164),
  email: string,
  company_name?: string
}
```

The edge function:
1. Runs `toCanonicalIndustryId(industry)` to normalize aliases ("ac repair" → `hvac`, "lawn care" → `landscape`).
2. **Refuses if `isIndustryHipaaGated(id)` returns true** → response tells Aura to say *"That vertical isn't open for self-serve demos yet — let me have our team reach out."*
3. Calls `create-demo-trial` with the **resolved industry ID**, which already:
   - Seeds the demo company's `industry_vertical`
   - Loads the matching `industry_template_pack` (terminology, KPIs, prompts)
   - Pre-populates the dashboard with industry-specific empty-state copy + sample workflows
4. Builds the magic link with `?industry=<id>` so the auto-login route can verify on entry.

## SMS / Email copy (industry-personalized)

SMS:
> *Hey {name}, here's your live {IndustryLabel} walkthrough of Aura: {link}. Tap to open — your demo is pre-loaded with sample {jobsTerm} and a {receptionistName} ready to take calls. Expires in 24h.*

Where `IndustryLabel`, `jobsTerm`, and `receptionistName` come from `industry_template_packs.terminology` for the resolved ID.

Email: same, with industry-matched hero image and a "What you'll see in your {Industry} demo" bullet list pulled from the pack.

## Auto-login flow

New route `/demo/auto-login?token=...&industry=...`:
- Verifies signed token (24h TTL, HMAC with edge secret).
- Calls existing demo trial auto-login RPC.
- Confirms `industry_vertical` on the trial matches the URL param; mismatch → 403.
- Drops the user straight into `/dashboard` where `useIndustryPack` resolves the matching pack and renders industry-correct labels everywhere.

## Files to create / edit

**New**
- `supabase/functions/send-walkthrough-demo/index.ts`
- `src/pages/DemoAutoLogin.tsx` (+ route in `App.tsx`)

**Edited**
- `src/components/ai/VoiceChat.tsx` — register `clientTools.send_walkthrough_demo` that calls the edge function
- `src/pages/TalkToAura.tsx` — small chip: *"Ask Aura for a live walkthrough — she'll text you a link for your industry."*
- `supabase/functions/voice-swaig/index.ts` — route incoming SWAIG `send_walkthrough_demo` calls to the new edge function
- `src/pages/Index.tsx` + `src/pages/ForBusiness.tsx` — CTA copy under phone number / Talk-to-Aura button

**Manual (ElevenLabs dashboard)**
- Register `send_walkthrough_demo` client tool with the schema above
- Update Aura agent system prompt with the industry-capture step
- Update memory `mem://features/integrations/elevenlabs-client-tools-dashboard-config`

## Guardrails

- Rate limit: 1 send per phone+email per 10 min (prevents SMS pumping; matches Twilio fraud guidance).
- Strict E.164 normalization on phone before SMS.
- `home_health` / `physical_therapy` / `occupational_therapy` / `hospice` → polite decline + human handoff offer.
- Log every send: `sms_logs`, `leads` (source: `voice_demo_phone` or `voice_demo_web`), `lead_activities`, and `call_logs.linked_demo_trial_id` for phone sessions.
- Industry mismatch between token and URL → reject auto-login.

## Validation

- Web: open `/talk-to-aura`, say *"I run an HVAC company in Austin, my name is Steve, 512-555-1212, steve@acme.com"* → receive SMS + email within 10s → tap link → land in dashboard with HVAC pack (job board says "Service Calls", agent says "Dispatcher").
- Same script but say *"I'm a plumber"* → demo shows Plumbing pack.
- Phone: call sales line, run same script → identical result.
- Say *"I run a home health agency"* → Aura declines politely.
- Call twice in 5 min → second call says *"I already sent it — check your messages."*

## Effort
~3–4 hours: ~2h edge function + auto-login, ~30 min UX wiring, ~30 min ElevenLabs dashboard config + prompt, ~30 min testing across both web and phone paths.