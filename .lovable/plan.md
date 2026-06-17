## Goal

Give Aura — on the Aura Intercept marketing site (Message Aura chat + Talk to Aura voice / mobile number) — a strong sales pitch that:
1. Answers questions from the Aura Intercept knowledge base (features, 4-tier pricing, beta sale, 60-day trial, 3rd-party pass-through, onboarding, integrations).
2. Actively qualifies the visitor and pushes them toward booking a call with a live salesperson.

Scope: **Aura Intercept's own Aura only.** Customer company agents are configured separately and are not touched here.

## What changes

### 1. New shared prompt module — `supabase/functions/_shared/aura-intercept-sales-prompt.ts`
Single source of truth used by the website chat and copy-pasted into the ElevenLabs voice agent dashboard for Talk to Aura. Contains:

- **Identity:** "I'm Aura, the AI receptionist that runs on the Aura Intercept platform. I'm also a live demo — what you're experiencing right now is what your customers would get."
- **Knowledge base** (pulled from current homepage + export docs, kept in sync with existing `landing-chat` content):
  - 24 Smart AI Agents → 10 Operatives across 7 Consoles + Operatives Hub
  - 4 tiers with Beta Pricing (strike-through originals): Core $497 / Boost $994 / Pro $1,988 / Elite $3,979 + 50% off onboarding
  - 60-Day Live Trial (30d concierge onboarding + 30d full live use), onboarding fee due at start, non-refundable once onboarding begins
  - 3rd-party pass-through policy (SignalWire, ElevenLabs, Resend, Tavily, Stripe, A2P 10DLC, social) — customer's own accounts, billed directly, never marked up
  - Channels: Message Aura (text, all tiers), Talk to Aura (voice, all paid tiers), AI Receptionist (inbound calls/SMS)
  - Industries: HVAC, plumbing, electrical, landscaping, restaurants, salons, and other appointment-based service businesses
- **Sales playbook (the pitch):**
  - Open with a hook tied to lost revenue from missed calls / after-hours leads
  - Discover: ask 1–2 qualifying questions (industry, team size, current pain — missed calls, no-shows, slow follow-up)
  - Map pain → specific operative (Receptionist, Booking, Follow-Up, Dispatch, Review, etc.)
  - Recommend a tier based on team size and needs (use the 4-tier map)
  - Always anchor on the beta sale price + 60-day trial as the risk-reversal
  - Be transparent about 3rd-party costs being separate (never "bundled")
- **Conversion CTAs (always offer one at the end of a meaningful exchange):**
  - Primary: "Want me to set up a 15-minute call with our team? I just need your name, email, and best number."
  - Secondary: "I can also text or email you a personalized walkthrough — what's the best number/email?"
  - Tertiary: "Or hit the Sign In button to start your 60-day trial yourself."
- **Guardrails:** stay in Aura Intercept scope, don't pretend to be a human, don't quote 3rd-party usage prices, never promise to absorb vendor fees, escalate to live sales when asked.
- **Voice-specific tweaks** (separate export): shorter sentences, no markdown, spell out prices ("four hundred ninety-seven dollars a month"), confirm contact info by repeating digits back.

### 2. `supabase/functions/landing-chat/index.ts`
Replace the inline `AURA_SYSTEM_PROMPT` with the import from the shared module (text variant). No behavior change beyond the upgraded prompt.

### 3. Lead capture from chat — `supabase/functions/landing-capture-lead/index.ts` (new, optional but recommended)
When Aura collects name + email + phone in chat, the frontend posts to this function which inserts into the existing `leads` table tagged `source = 'talk_to_aura_website'`, so sales actually gets the handoff. Surfaces in the existing leads console.

- Adds a small tool-ish flow: the chat UI watches for a structured `[[LEAD]]{json}[[/LEAD]]` marker the model emits, parses it, posts to the function, and replaces the marker with a friendly confirmation in the bubble.
- Same pattern documented in the voice prompt so ElevenLabs can call an equivalent client tool (already wired via `VoiceChat` → `voice-agent-tools`).

### 4. Talk to Aura voice agent (ElevenLabs)
The ElevenLabs agent is configured in the ElevenLabs dashboard (Aura Intercept's own agent ID, used by the marketing site voice widget and the published phone number). The shared prompt module exports a `VOICE_PROMPT` constant; we add a small admin-only page section at `/dashboard/integrations/voice` (or extend the existing `ElevenLabsToolChecklist`) with a **"Copy Talk to Aura sales prompt"** button so the latest prompt can be pasted into the ElevenLabs agent in one click. No code can push to ElevenLabs without their API setup; the copy-paste workflow keeps this single-source-of-truth.

### 5. Docs
Add the sales pitch + KB summary to `src/components/documentation/SalesPitchDataPDF.tsx` so it appears in the Export Documentation bundle, and reference it from `helpContentConfig.ts` under "Talk to Aura".

## Files touched

```text
NEW  supabase/functions/_shared/aura-intercept-sales-prompt.ts
EDIT supabase/functions/landing-chat/index.ts
NEW  supabase/functions/landing-capture-lead/index.ts
EDIT src/components/landing/LandingAIChat.tsx        (parse [[LEAD]] marker, call capture fn)
EDIT src/components/landing/FloatingChatWidget.tsx   (same parsing if it renders independently)
EDIT src/components/admin/ElevenLabsToolChecklist.tsx (Copy voice prompt button)
EDIT src/components/documentation/SalesPitchDataPDF.tsx
EDIT src/lib/helpContentConfig.ts
```

No database migrations (reuses `leads`). No new secrets. Stays inside the "Aura Intercept only" scope — customer company agents continue to use their own per-company prompts.

## Out of scope

- Per-industry / per-customer-company agent prompts (handled separately at company onboarding).
- Changing pricing, tier structure, or the 60-day trial mechanics.
- Building a calendar booker inside chat (Aura just captures contact info → live sales follows up).
