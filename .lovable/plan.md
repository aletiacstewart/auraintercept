

# Fix: No Audio on Voice Chat (Autoplay Policy)

## Problem

The voice chat connects successfully (UI shows "Listening...") but produces no sound. This happens because:

1. The app runs inside a preview iframe
2. Browsers block audio autoplay in iframes unless an `AudioContext` is explicitly resumed during a user gesture (click)
3. The ElevenLabs SDK creates its own `AudioContext` internally, but by the time it does so (after async token fetch), the browser no longer considers it part of the original click gesture

## Solution

**Pre-warm an AudioContext synchronously on the button click**, before any async operations. This "unlocks" audio playback for the page. The ElevenLabs SDK will then be able to play audio because the page's audio policy has already been satisfied.

### Changes to `src/components/ai/VoiceChat.tsx`

In the `startConversation` function, add these lines **at the very top** (before any `await`):

```typescript
const startConversation = useCallback(async () => {
  setIsConnecting(true);

  // Unlock audio playback immediately on user gesture (before any async work)
  // Browsers require AudioContext.resume() during a click to allow audio in iframes
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    await ctx.resume();
    // Play a silent buffer to fully unlock audio
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start();
  } catch (e) {
    console.warn("[VoiceChat] AudioContext unlock failed:", e);
  }

  // ... rest of existing startConversation logic unchanged
```

This is a well-known pattern for unlocking audio in restricted browser contexts (iframes, mobile Safari, etc.).

### Why This Works

The browser tracks whether audio was "initiated by user gesture." By creating and resuming an AudioContext synchronously inside the click handler, we satisfy this requirement. When the ElevenLabs SDK later creates its own audio pipeline, the browser allows playback because the page already has audio permission.

## Summary

| File | Change |
|------|--------|
| `src/components/ai/VoiceChat.tsx` | Add AudioContext unlock at the start of `startConversation` (before async token fetch) |

No backend or edge function changes needed. This is a single ~10-line addition.

