## Add Aura avatar to Contact page's Talk to Aura box

Make Aura visually present at the top of the "Talk to Aura (Voice)" card on `/contact`, sitting above the tip/terms/VoiceChat. Purely presentational — does not change voice booking flow.

### Changes

1. **`src/components/aura/AuraAvatarChat.tsx`**
   - Add a named `export` to the existing `AuraCharacter` SVG component so it can be reused as a standalone visual.

2. **`src/pages/Contact.tsx`**
   - Import `AuraCharacter` from `@/components/aura/AuraAvatarChat`.
   - Inside the Talk to Aura card's `CardContent`, render a centered avatar block above the "Tip" panel:
     - `AuraCharacter` size ~140, `connected={false}`, `speaking={false}`, gentle idle animation defaults.
     - Small caption underneath: "Aura — your AI receptionist".
   - Drive `connected`/`speaking` from transcript activity: flip `speaking=true` briefly when `handleTranscript` receives an assistant message, then back to false (simple local state with a debounce timeout).
   - Use semantic tokens only (no hex). No layout shifts to surrounding cards.

### Out of scope
- VoiceChat internals, ElevenLabs wiring, terms gate, text-mode toggle.
- Replacing VoiceChat with AuraAvatarChat (would create a second voice session — avoided).
- Global floating Sparkles bubble.

### Verification
- `/contact` Talk to Aura card shows the Aura SVG avatar at the top, with caption, above the existing tip + terms + VoiceChat.
- Starting a voice session via VoiceChat still works; the avatar briefly animates when Aura speaks.
- No duplicate voice connections, no console errors, no TypeScript errors.
