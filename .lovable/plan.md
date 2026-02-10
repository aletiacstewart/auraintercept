

# Fix: Hold Message Delayed by Blocking DB Write

## Root Cause

In `voice-handler/index.ts` lines 538-569, when the AI exceeds the 3-second deadline, the code runs:

```typescript
if (raceResult === 'timeout') {
  await supabase.from('call_logs').update({...}).eq('id', callLogId);  // BLOCKS 5 seconds!
  fetch(...).catch(...);  // fire-and-forget (fine)
  return twimlResponse(...);  // Too late -- SignalWire gave up
}
```

The `await` on the DB update blocks the TwiML response by ~5 seconds. Combined with the 3-second race timer, SignalWire receives the hold message at 8 seconds -- well past its timeout window. The call drops.

**Evidence from logs:**
```
15:19:06  "consultation" → process starts
15:19:14  Hold message returned (8s later -- too slow)
15:19:15  Background starts
15:19:19  AI response saved -- but the call is already dead
```

## The Fix (1 file, 2 changes)

### Change 1: Make DB update fire-and-forget in timeout branch

Remove the `await` on the DB update so the TwiML returns immediately after the 3s race:

**Before (line 542):**
```typescript
await supabase.from('call_logs').update({
  metadata: { ... ai_pending: true ... }
}).eq('id', callLogId);
```

**After:**
```typescript
// Fire-and-forget: don't block TwiML response
supabase.from('call_logs').update({
  metadata: { ... ai_pending: true ... }
}).eq('id', callLogId).then(() => {
  console.log('[voice-handler] Pending state saved');
}).catch(err => {
  console.error('[voice-handler] Failed to save pending state:', err);
});
```

### Change 2: Add race timeout to pickup TTS generation

In `handlePickup` (line 657), the TTS generation + DB save also runs synchronously. If TTS takes too long, the pickup response itself times out. Add a similar pattern: attempt TTS, but if it takes over 4 seconds, fall back to Polly.

**Before (line 657):**
```typescript
const [_, replyAudioUrl] = await Promise.all([
  supabase.from('call_logs').update({...}).eq('id', callLogId),
  elevenlabsApiKey ? ttsAudioUrl(...) : Promise.resolve(null),
]);
```

**After:**
```typescript
// DB save is fire-and-forget in pickup too
supabase.from('call_logs').update({...}).eq('id', callLogId).catch(() => {});

// Race TTS against 4s deadline -- fall back to Polly if too slow
let replyAudioUrl: string | null = null;
if (elevenlabsApiKey) {
  const ttsTimer = new Promise<null>(r => setTimeout(() => r(null), 4000));
  replyAudioUrl = await Promise.race([
    ttsAudioUrl(supabase, callLog.company_id, reply, elevenlabsApiKey, elevenlabsVoiceId),
    ttsTimer,
  ]);
}
```

## Expected Timing After Fix

| Step | Before | After |
|------|--------|-------|
| Race fires at 3s | DB write blocks 5s more | TwiML returns immediately |
| Hold TwiML sent | ~8s (too late) | ~3.1s (well within limit) |
| Pickup responds | ~4s (TTS blocks) | 4s max (Polly fallback) |

## No New Files or DB Changes

Same file, same functions -- just removing blocking `await` calls from the critical response path.

