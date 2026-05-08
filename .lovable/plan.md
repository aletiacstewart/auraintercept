## Goal

Stop drawing fake facial features over Aura's portrait. The mouth/brow/blush overlays don't align with the photo and look uncanny. Replace them with subtle, tasteful motion that reacts to audio without trying to fake lip-sync.

## Changes (single file: `src/components/aura/AuraAvatarChat.tsx`)

1. **Remove from `AuraCharacter`:**
   - All SVG mouth shapes (ellipses driven by viseme)
   - Brow lines and tilt logic
   - Blush circles
   - Eyelid blink ellipses (skin-tone ones drawn over her eyes)
   - `viseme` and `expression` props

2. **Keep / enhance subtle motion on the portrait itself:**
   - **Breathing**: gentle 4s scale loop (1.0 → 1.012 → 1.0)
   - **Speaking pulse**: when `mouthOpen > 0.1`, add a tiny scale boost (up to +1.5%) and brightness shift (filter: brightness 1.0 → 1.06) tied to amplitude — the whole portrait subtly "lifts" with her voice instead of fake mouth movement
   - **Head sway**: very slight rotation ±0.5° on a 6s loop while speaking, paused when idle
   - **Idle micro-zoom**: +/- 0.3% on slow loop when listening

3. **Strengthen the audio-reactive ring around her** (already exists as the cyan glow):
   - Drive the ring's blur/opacity/scale directly from `mouthOpen` amplitude
   - Add a second softer outer pulse ring that expands on high-amplitude peaks (the "talking" indicator users actually read)
   - Color shifts subtly with expression state (cyan idle → warmer cyan when speaking)

4. **Keep expression state machine** but use it only to drive ring color/intensity, not facial overlays:
   - `listening` → steady cyan ring
   - `speaking` → brighter, audio-pulsing ring
   - `thinking` → slow rotating gradient on the ring
   - `concerned` → dimmer, slower pulse

5. **Cleanup**: remove now-unused `Viseme` type, FACE anchor constants, viseme picker logic in the audio analyzer (keep just the amplitude calculation for the ring + scale).

## Result

- No fake face fighting the real face
- Portrait stays photo-real and clean
- Clear visual feedback she's listening/speaking via the ring + subtle breathing/scale
- Zero cost, no external services, instant
