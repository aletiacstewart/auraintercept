## Goal
Swap the stylized SVG `AuraCharacter` in `src/components/aura/AuraAvatarChat.tsx` with the uploaded cyan-haired headset portrait, kept alive with subtle animations driven by the same call state.

## Steps

1. **Add the asset**
   - Copy `user-uploads://avatar.png` → `src/assets/aura-avatar.png`.
   - Import it as an ES6 module in `AuraAvatarChat.tsx`.

2. **Rebuild `AuraCharacter`**
   - Render a circular framed `<img>` of the portrait inside the existing pulse-ring wrapper (keep current size/variant logic).
   - Keep the gradient halo behind it; intensify on `connected` / `speaking` (same scale + opacity logic as today).
   - Add a soft conic/gradient ring border that rotates slowly when connected (`animate-spin` slow) for a "live" feel.
   - When `speaking`: overlay an animated equalizer bar row near the mouth area (3–5 bars whose heights follow `mouthOpen` from frequency data) — replaces the SVG mouth so we still get real lip-sync energy on top of the static face.
   - When `connected` but idle: gentle breathing scale (`1 → 1.02`, 3s ease-in-out) on the image.
   - Keep blink loop but apply it as a quick eyelid overlay (a thin horizontal bar that flashes across the eye region) — optional, only if it looks clean; otherwise drop blink for the photo version.
   - Add `aria-label="Aura"` and `loading="eager"`.

3. **Remove now-unused SVG defs/eyes/mouth/cheek code** inside `AuraCharacter`. Leave the rest of `AuraAvatarChat` (call logic, captions, controls) untouched.

4. **Verify**
   - Check the floating launcher (`AuraAvatarFloating`) and the hero/inline usages still render at sizes 140 and 160.
   - Confirm no other file imports the old SVG character.

## Out of scope
No backend, ElevenLabs, or routing changes. Pure presentation swap inside `AuraAvatarChat.tsx` + one new asset.
