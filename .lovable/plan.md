## Goal
Make the Aura portrait look like she's talking and reacting — no third-party services, no recurring cost — by overlaying animated mouth/eye/brow shapes on top of the existing photo, driven by the audio + agent events we already have.

## How it works
The portrait stays as a base layer. We position transparent overlays (mouth, eyelids, brows, blush) over the face area and swap/animate them in real time using:
- `getOutputByteFrequencyData()` from the existing ElevenLabs `useConversation` hook → mouth openness + shape
- `isSpeaking`, `onMessage` (`agent_response`, `user_transcript`), `onError` → expressions

## Steps

### 1. Generate overlay assets (one-time, free via Lovable AI image gen)
Create transparent PNGs aligned to the face, all 512×512 with the mouth/eye region in the same coordinates as the portrait:
- `mouth-closed.png`, `mouth-small.png`, `mouth-mid.png`, `mouth-wide.png`, `mouth-o.png`, `mouth-smile.png`
- `eyes-open.png` (default — already in the photo, used only when we need a "wide eyes" surprised look), `eyelid-closed.png` (for blink)
- `brow-neutral.png`, `brow-raised.png`, `brow-concerned.png`
- `blush.png` (soft pink cheek glow for "happy/speaking" state)

Save to `src/assets/aura/`. Use `imagegen--generate_image` with `transparent_background: true`.

### 2. Build viseme picker (audio → mouth shape)
In `AuraAvatarChat.tsx`, extend the existing rAF loop:
- Compute overall amplitude (already done → `mouthOpen`)
- Compute low/mid/high band ratios from the same frequency array
  - High energy + wide spread → "E/I" (mouth-wide)
  - Low energy dominant → "O/U" (mouth-o)
  - Mid balanced → "A" (mouth-mid)
  - Low amplitude → mouth-small
  - Silence → mouth-closed
- Smooth with a small (~80ms) cross-fade between shapes to avoid flicker

### 3. Expression state machine
Track an `expression` state: `neutral | listening | thinking | happy | concerned | surprised`.
- `onConnect` → happy (1.5s) → neutral
- `user_transcript` arriving → listening (brow-raised slightly, head tilt 2°)
- Pause >800ms after user finishes → thinking (brow-neutral, eyes glance up via translate)
- `agent_response` start → happy (subtle smile sprite + blush)
- `onError` → concerned (brow-concerned, mouth-small)

### 4. Idle micro-motion
- Random blink every 2.5–6s (already implemented — switch from CSS bar to `eyelid-closed.png` overlay, 140ms)
- Subtle head bob: wrap portrait in a div with a 4s ease-in-out keyframe rotating ±0.8° and translating ±1px
- Pupil drift: occasional 2–3px translate on an "eye-shine" overlay every 4–7s

### 5. Component structure
Refactor `AuraCharacter` in `src/components/aura/AuraAvatarChat.tsx`:
```
<div idle-bob>
  <img portrait />            ← base layer
  <img current-mouth />       ← absolute, positioned over mouth
  <img current-brow />        ← absolute, over brow
  <img blush /> (when happy)  ← absolute, low opacity
  <img eyelid-closed /> (blink only)
  <eq-bars /> (existing, kept as accent ring at bottom)
</div>
```
All overlays use `position: absolute`, `pointer-events: none`, with percentage-based positioning calibrated to the portrait. Cross-fade between mouth shapes via `opacity` + `transition: opacity 60ms`.

### 6. Performance & accessibility
- Preload all sprite PNGs once on first render
- `prefers-reduced-motion` → skip blink, head bob, expression swaps; just show base portrait + amplitude-only mouth
- Total asset weight target: <400KB (transparent PNGs at 512×512 compress well)

## What's intentionally NOT in scope
- No third-party talking-head video (Simli/HeyGen/D-ID) — that's the paid path
- No phoneme-accurate alignment from text — keeps complexity low; the audio-band heuristic looks convincing for conversational speech
- No Rive/Lottie rig — that needs an art pass

## Files touched
- `src/components/aura/AuraAvatarChat.tsx` (rewrite `AuraCharacter`)
- `src/assets/aura/*.png` (new sprite folder)
- `src/index.css` (one new keyframe `aura-head-bob` if not already present)

## Out of scope
ElevenLabs config, edge functions, routing, other components.
