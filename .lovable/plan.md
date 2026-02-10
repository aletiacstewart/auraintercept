

# Fix: One-Line Crash in Pickup Handler

## What's Happening

The good news: the two-phase response system IS working. The logs prove it:

1. "I need to book an appointment" is received
2. AI exceeds 3s, hold message returns immediately
3. Background processing completes the AI call
4. Pickup fires and finds the response ready

Then it crashes on a single line with: `TypeError: supabase.from(...).update(...).eq(...).catch is not a function`

The database client's `.eq()` method supports `.then()` but NOT `.catch()` directly. The previous fix used `.catch(() => {})` on line 675, which crashes. The other fire-and-forget on line 553 correctly uses `.then().catch()` and works fine.

## The Fix (1 line)

### File: `supabase/functions/voice-handler/index.ts`, line 675

Change:
```typescript
}).eq('id', callLogId).catch(() => {});
```

To:
```typescript
}).eq('id', callLogId).then(() => {}).catch(() => {});
```

That's it. The pickup handler will stop crashing and the caller will hear the AI's actual response instead of the error fallback.

## Why This Will Work

The logs from the latest call at 15:25 show:
- 15:24:57 -- "I need to book an appointment" received
- 15:25:01 -- Hold message sent (4s, within limit)
- 15:25:05 -- Background AI response saved
- 15:25:08 -- Pickup fires, finds response ready
- 15:25:09 -- CRASH on `.catch()` line

Everything before the crash works. Once this line is fixed, the pickup will proceed to generate TTS and return the AI response to the caller.

