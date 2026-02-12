
## Fix: Improve Browser Voice Selection for Female Voice

### Problem
The current `pickDefaultVoice()` function in `src/lib/browserTts.ts` uses a narrow regex pattern that only matches specific hardcoded voice names like "Samantha", "Karen", "Victoria", etc. On most systems, these exact names don't exist, so the function falls back to:
1. Any English voice (which defaults to the system's first voice)
2. First available voice

This results in a deep male voice being selected instead of a natural female voice.

### Root Cause
- Browser voice names vary significantly by OS and browser (e.g., "Google English Female", "Microsoft Zira", "Google US English")
- The regex pattern is too specific and only matches a few hardcoded names
- The fallback strategy doesn't explicitly filter for female voices

### Solution
Improve `pickDefaultVoice()` in `src/lib/browserTts.ts` with a multi-step selection strategy:

1. **First priority**: Look for voices with "female" in the name AND English language
2. **Second priority**: Filter out male voices and select any other English voice (assumes default is female on most systems)
3. **Third priority**: Return the first voice if no English voice found
4. **Safety check**: If the selected voice name contains "male", try to find an alternative

### Implementation Details

**File to modify**: `src/lib/browserTts.ts`

Replace the `pickDefaultVoice()` function with improved logic:
- Explicitly search for voices containing "female" in the name (case-insensitive)
- If no female voice found, search for voices that DON'T contain "male" in the name
- Prioritize natural/premium voices by checking localService flag
- Add a comment explaining browser voice naming conventions across different systems

### Browser Compatibility Note
Different browsers return different voice names:
- Chrome/Edge: "Google US English Female", "Microsoft Zira" (Windows)
- Safari: "Samantha", "Victoria" (macOS) 
- Firefox: Limited voice support, often only default system voice

This improved logic will work across all these variants.

### Impact
- Users will now get a natural female voice in the browser voice mode instead of a deep male voice
- No changes needed to other files (the utility is used transparently by `useBrowserVoiceChat.ts`)
- Zero breaking changes—existing functionality remains the same

