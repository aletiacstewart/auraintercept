# Aura Avatar — Sigmond-style Voice Companion

Build **Aura**, an animated, stylized character that users can talk to via WebRTC voice. Aura appears as a circular "video tile" with a face that lip-syncs and reacts to audio levels in real time. Same component reused on the public landing page and inside the dashboard.

## Goals

- Brand-forward animated character (not a generic orb, not a photoreal human).
- Real-time two-way voice via ElevenLabs Conversational AI (WebRTC).
- Lip-sync + idle animation driven by output audio amplitude.
- Live captions, "thinking / listening / speaking" status pills.
- Reusable across `/` (hero + floating widget) and `/dashboard` (inline panel).

## User experience

```text
┌──────────────────────────────┐
│   ◉  ●●●●  AURA              │  ← status: Listening / Thinking / Speaking
│  ╭──────────╮                │
│  │   ◉  ◉   │  ← eyes blink  │
│  │    ◡     │  ← mouth lip-  │
│  ╰──────────╯     syncs      │
│   ░░▓▓▓▓░░  audio waveform   │
│  [ Tap to talk ]  [ End ]    │
│  "How can I help today?"     │  ← live caption
└──────────────────────────────┘
```

1. User clicks **Talk to Aura** → mic permission prompt with explainer.
2. Edge function mints an ElevenLabs WebRTC token.
3. Connection opens; Aura greets with industry-aware first message.
4. While speaking: mouth opens/closes proportional to `getOutputByteFrequencyData()`, glow ring pulses.
5. While listening: subtle idle breathing + eye blink loop, ring uses input level.
6. Captions stream from `user_transcript` and `agent_response` events.
7. **End** disconnects cleanly; transcript optionally saved to `aura_conversations`.

## Avatar art

Stylized SVG character, ~3 layers driven by React state:

- **Base** — head/shoulders silhouette (single SVG, themed via `currentColor` so it inherits Cyber-Sentry tokens).
- **Eyes** — two `<ellipse>` elements; blink = scaleY 1 → 0.05 → 1 every 4–7s (randomized).
- **Mouth** — morphing `<path>` between closed / mid / open shapes; index chosen from current audio amplitude bucket (0/1/2).
- **Aura ring** — concentric rings using `--gradient-primary` and `glow-primary`, scale based on volume.

Asset generated with `imagegen` at standard quality, transparent PNG fallback at `src/assets/aura-avatar.png` for static contexts (OG images, email).

## Architecture

```text
LandingPage / DashboardLayout
        │
        ▼
  <AuraAvatarChat variant="hero|floating|inline">
        │
        ├── useAuraConversation()  ← wraps @elevenlabs/react useConversation
        │       ├─ fetch /elevenlabs-aura-token (edge fn)
        │       ├─ startSession({ conversationToken, connectionType: 'webrtc' })
        │       └─ exposes: status, isSpeaking, outputLevel, captions[]
        │
        ├── <AuraCharacter level={level} state={state} />   ← SVG
        ├── <AuraCaptions messages={captions} />
        └── <AuraControls onStart onEnd onMute />
```

### Edge function `elevenlabs-aura-token`

- `verify_jwt = false` (public landing must call it; rate-limited by IP).
- Calls `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=AURA_AGENT_ID` with `ELEVENLABS_API_KEY`.
- Accepts optional `industry` + `companyId` to pass through as `dynamic_variables` for prompt overrides.
- Returns `{ token }`.

### ElevenLabs agent config (manual, in ElevenLabs dashboard)

- New agent **"Aura"** with system prompt aligned to the platform's master Aura prompt (industry-aware via dynamic variables).
- Enable WebRTC, overrides for `agent.prompt`, `firstMessage`, `language`.
- Client tools registered (so Aura can act, not just talk):
  - `navigate_to(path)` — router push inside dashboard.
  - `open_console(operative)` — opens the matching console.
  - `book_demo()` / `start_signup()` — landing-page CTAs.
  - `show_pricing_tier(tier)` — scrolls to pricing.

## Where it appears

| Surface | Component | Notes |
|---|---|---|
| `/` landing hero | `<AuraAvatarChat variant="hero" />` | Replaces or augments existing hero CTA. Sigmond-style large circle. |
| Landing floating widget | `<AuraAvatarChat variant="floating" />` | Bottom-right; collapses to avatar bubble. Replaces / wraps `FloatingChatWidget`. |
| `/dashboard/*` | `<AuraAvatarChat variant="inline" />` | Lives inside Aura Command Center next to existing text chat; toggle "Voice mode". |
| Customer portal | Same `inline` variant | Industry pack drives greeting + tools. |

Industry pack continues to drive prompt + greeting via existing `useIndustryPack` and `industryVoiceGreetings.ts`.

## Files (new)

- `src/components/aura/AuraAvatarChat.tsx` — top-level wrapper with variants.
- `src/components/aura/AuraCharacter.tsx` — animated SVG.
- `src/components/aura/AuraCaptions.tsx` — caption stream.
- `src/components/aura/AuraControls.tsx` — start/end/mute buttons.
- `src/hooks/useAuraConversation.ts` — wraps `useConversation`, audio levels, caption buffer, client-tool router.
- `src/assets/aura-avatar.png` — static fallback (imagegen).
- `supabase/functions/elevenlabs-aura-token/index.ts` — token mint.

## Files (edited)

- `src/pages/Index.tsx` (or current landing) — embed hero variant.
- `src/components/landing/FloatingChatWidget.tsx` — swap to floating variant or extend.
- `src/components/dashboard/DashboardLayout.tsx` — inline mount point.
- `supabase/config.toml` — `verify_jwt = false` for the new function.

## Secrets / config

- Reuses existing `ELEVENLABS_API_KEY` (already configured).
- New env: `AURA_ELEVENLABS_AGENT_ID` (added via secrets tool after the agent is created in ElevenLabs).
- No DB changes required for v1. Optional v1.1: `aura_conversations` table to persist transcripts.

## Out of scope (v1)

- Photoreal/video avatars (HeyGen/D-ID/Tavus) — can be added later behind the same component API.
- 3D / Rive — start with SVG; upgrade path is straightforward (swap `AuraCharacter`).
- Persistent conversation history across sessions.

## Acceptance criteria

- Click "Talk to Aura" on landing → mic prompt → connected within ~2s → Aura greets.
- Mouth visibly lip-syncs to TTS output; ring pulses with volume.
- Captions appear for both user and Aura turns.
- "End" cleanly closes WebRTC and resets UI.
- Same component renders inline in dashboard with industry-specific greeting.
- All colors via theme tokens (no hex/rgba), respects Cyber-Sentry standard.
