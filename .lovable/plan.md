

# Fix: Services Not Loading, Custom Voice Not Working, Email Handling

## Problems Found

### 1. Services NEVER load -- wrong column name (critical bug)
The `services` table uses `is_active` as the column name, but the code queries `.eq('active', true)` in THREE places:
- `voice-handler/index.ts` line 372: `.eq('active', true)` -- loads 0 services every time
- `voice-swaig/index.ts` line 236: `.eq('active', true)` -- service lookup for booking fails
- `voice-swaig/index.ts` line 285: `.eq('active', true)` -- get_services returns "no services listed"

The logs confirm this: `"Loaded 0 active services for company 04c57cbe-358e-4036-a3ad-b777a55f5be0"` -- there IS one active service ("Aura Intercept Consultation, 45 min") but the query silently returns nothing.

### 2. Custom ElevenLabs voice requires API key in SignalWire
The voice ID `cgSgspJ2msm6clMCkdW9` is a custom/cloned voice, not one of SignalWire's built-in ElevenLabs voices. SignalWire can use built-in voices (Rachel, Sarah, etc.) without configuration, but custom voice IDs require your ElevenLabs API key to be added to your SignalWire account.

**You need to do this in SignalWire Dashboard:**
1. Go to your SignalWire Space settings (or AI Agent settings)
2. Look for "Integrations" or "TTS Provider" settings
3. Add your ElevenLabs API key: `sk_4abda3d81bac2bcdaec7d9660d2e737da40e42e5314294c5`

If you can't find this setting, a fallback approach is to use one of SignalWire's built-in ElevenLabs voices (like "Rachel" or "Sarah") until the custom voice integration is confirmed.

### 3. Email dictation still getting cut off
Even with `end_of_speech_timeout` at 3000ms, email addresses have many natural pauses (spelling letters, saying "at", "dot"). The system prompt needs stronger guidance, and we should also add `barge_confidence` and `barge_match_string` tuning to prevent premature interruption.

## Changes

### 1. Fix column name in `voice-handler/index.ts`
- Line 372: Change `.eq('active', true)` to `.eq('is_active', true)`

### 2. Fix column name in `voice-swaig/index.ts` (two places)
- Line 236: Change `.eq('active', true)` to `.eq('is_active', true)` (in `handleBookAppointment`)
- Line 285: Change `.eq('active', true)` to `.eq('is_active', true)` (in `handleGetServices`)

### 3. Add voice fallback in `voice-handler/index.ts`
In `buildSWMLDocument`, if the voice ID is a custom clone ID, keep it but also add a fallback to a built-in voice name. Update the voice string to use the name format if the ID is not in SignalWire's recognized list. Alternatively, add a comment and log so we can debug if the voice doesn't activate.

### 4. Strengthen email handling in system prompt
In `buildPhoneSystemPrompt`, add explicit instructions:
- "When confirming an email address, spell it back letter by letter"
- "Wait for the caller to finish spelling before repeating it back"
- "If you're unsure about any part of the email, ask them to spell just that part"

### 5. Add `barge_confidence` parameter
In the SWML `params` block, add `barge_confidence: 0.7` (higher threshold means the AI is less likely to interrupt the caller based on partial speech detection).

## No Database Changes

All fixes are edge function code only.

## Expected Results

| Issue | Before | After |
|-------|--------|-------|
| Services loaded | 0 (wrong column name) | 1 ("Aura Intercept Consultation") |
| Service awareness | AI says "no services listed" | AI describes the consultation service |
| Booking duration | Falls back to 60 min | Uses correct 45 min |
| Email handling | Cuts off mid-dictation | Higher interruption threshold + prompt guidance |
| Voice | May fall back to default (custom ID not recognized) | Fallback to built-in voice if custom fails |

